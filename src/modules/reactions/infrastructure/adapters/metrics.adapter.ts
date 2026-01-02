import { Injectable, Logger } from '@nestjs/common';

export interface IMetricsAdapter {
  incrementCounter(name: string, labels?: Record<string, string>): void;
  decrementCounter(name: string, labels?: Record<string, string>): void;
  recordGauge(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void;
  recordHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void;
  startTimer(name: string, labels?: Record<string, string>): () => void;
  recordDuration(
    name: string,
    durationMs: number,
    labels?: Record<string, string>,
  ): void;
  getMetrics(): Promise<Record<string, any>>;
  reset(): void;
}

interface MetricValue {
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

interface CounterMetric {
  type: 'counter';
  values: MetricValue[];
  total: number;
}

interface GaugeMetric {
  type: 'gauge';
  values: MetricValue[];
  current: number;
}

interface HistogramMetric {
  type: 'histogram';
  values: MetricValue[];
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
}

interface TimerMetric {
  type: 'timer';
  startTime: number;
  name: string;
  labels: Record<string, string>;
}

@Injectable()
export class MetricsAdapter implements IMetricsAdapter {
  private readonly logger = new Logger(MetricsAdapter.name);
  private readonly metrics = new Map<
    string,
    CounterMetric | GaugeMetric | HistogramMetric
  >();
  private readonly activeTimers = new Map<string, TimerMetric>();
  private readonly MAX_METRIC_VALUES = 1000; // Limit memory usage

  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    try {
      const key = this.generateMetricKey(name, labels);
      const metric = this.getOrCreateMetric(name, 'counter') as CounterMetric;

      metric.total += 1;
      this.addMetricValue(metric, 1, labels);

      this.logger.debug(`Counter incremented: ${name}`, {
        labels,
        total: metric.total,
      });
    } catch (error) {
      this.logger.error(`Failed to increment counter: ${name}`, error);
    }
  }

  decrementCounter(name: string, labels: Record<string, string> = {}): void {
    try {
      const key = this.generateMetricKey(name, labels);
      const metric = this.getOrCreateMetric(name, 'counter') as CounterMetric;

      metric.total = Math.max(0, metric.total - 1);
      this.addMetricValue(metric, -1, labels);

      this.logger.debug(`Counter decremented: ${name}`, {
        labels,
        total: metric.total,
      });
    } catch (error) {
      this.logger.error(`Failed to decrement counter: ${name}`, error);
    }
  }

  recordGauge(
    name: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    try {
      const metric = this.getOrCreateMetric(name, 'gauge') as GaugeMetric;

      metric.current = value;
      this.addMetricValue(metric, value, labels);

      this.logger.debug(`Gauge recorded: ${name}`, { labels, value });
    } catch (error) {
      this.logger.error(`Failed to record gauge: ${name}`, error);
    }
  }

  recordHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    try {
      const metric = this.getOrCreateMetric(
        name,
        'histogram',
      ) as HistogramMetric;

      metric.count += 1;
      metric.sum += value;
      metric.min = Math.min(metric.min, value);
      metric.max = Math.max(metric.max, value);
      metric.avg = metric.sum / metric.count;

      this.addMetricValue(metric, value, labels);

      this.logger.debug(`Histogram recorded: ${name}`, {
        labels,
        value,
        count: metric.count,
        avg: metric.avg.toFixed(2),
      });
    } catch (error) {
      this.logger.error(`Failed to record histogram: ${name}`, error);
    }
  }

  startTimer(name: string, labels: Record<string, string> = {}): () => void {
    const timerId = this.generateTimerId();
    const timer: TimerMetric = {
      type: 'timer',
      startTime: Date.now(),
      name,
      labels,
    };

    this.activeTimers.set(timerId, timer);

    this.logger.debug(`Timer started: ${name}`, { timerId, labels });

    // Return stop function
    return () => {
      const activeTimer = this.activeTimers.get(timerId);
      if (activeTimer) {
        const duration = Date.now() - activeTimer.startTime;
        this.recordDuration(activeTimer.name, duration, activeTimer.labels);
        this.activeTimers.delete(timerId);

        this.logger.debug(`Timer stopped: ${activeTimer.name}`, {
          timerId,
          duration: `${duration}ms`,
          labels: activeTimer.labels,
        });
      }
    };
  }

  recordDuration(
    name: string,
    durationMs: number,
    labels: Record<string, string> = {},
  ): void {
    try {
      const durationName = `${name}_duration_ms`;
      this.recordHistogram(durationName, durationMs, labels);

      // Also record as a gauge for current duration
      const gaugeName = `${name}_current_duration_ms`;
      this.recordGauge(gaugeName, durationMs, labels);
    } catch (error) {
      this.logger.error(`Failed to record duration: ${name}`, error);
    }
  }

  async getMetrics(): Promise<Record<string, any>> {
    try {
      const result: Record<string, any> = {};

      for (const [name, metric] of this.metrics.entries()) {
        result[name] = {
          type: metric.type,
          valuesCount: metric.values.length,
          lastUpdated:
            metric.values.length > 0
              ? metric.values[metric.values.length - 1].timestamp
              : null,
        };

        switch (metric.type) {
          case 'counter':
            result[name].total = (metric as CounterMetric).total;
            break;
          case 'gauge':
            result[name].current = (metric as GaugeMetric).current;
            break;
          case 'histogram':
            const histMetric = metric as HistogramMetric;
            result[name] = {
              ...result[name],
              count: histMetric.count,
              sum: histMetric.sum,
              min: histMetric.min,
              max: histMetric.max,
              avg: Number(histMetric.avg.toFixed(2)),
            };
            break;
        }

        // Add recent values (last 10)
        result[name].recentValues = metric.values.slice(-10).map((v) => ({
          value: v.value,
          labels: v.labels,
          timestamp: v.timestamp,
        }));
      }

      // Add system info
      result._meta = {
        totalMetrics: this.metrics.size,
        activeTimers: this.activeTimers.size,
        timestamp: new Date(),
        memoryUsage: process.memoryUsage(),
      };

      return result;
    } catch (error) {
      this.logger.error('Failed to get metrics', error);
      return {};
    }
  }

  reset(): void {
    try {
      this.metrics.clear();
      this.activeTimers.clear();
      this.logger.debug('Metrics reset');
    } catch (error) {
      this.logger.error('Failed to reset metrics', error);
    }
  }

  private getOrCreateMetric(
    name: string,
    type: 'counter' | 'gauge' | 'histogram',
  ): CounterMetric | GaugeMetric | HistogramMetric {
    let metric = this.metrics.get(name);

    if (!metric) {
      switch (type) {
        case 'counter':
          metric = {
            type: 'counter',
            values: [],
            total: 0,
          };
          break;
        case 'gauge':
          metric = {
            type: 'gauge',
            values: [],
            current: 0,
          };
          break;
        case 'histogram':
          metric = {
            type: 'histogram',
            values: [],
            count: 0,
            sum: 0,
            min: Infinity,
            max: -Infinity,
            avg: 0,
          };
          break;
      }

      this.metrics.set(name, metric);
    }

    return metric;
  }

  private addMetricValue(
    metric: CounterMetric | GaugeMetric | HistogramMetric,
    value: number,
    labels: Record<string, string>,
  ): void {
    metric.values.push({
      value,
      labels,
      timestamp: new Date(),
    });

    // Limit memory usage by keeping only recent values
    if (metric.values.length > this.MAX_METRIC_VALUES) {
      metric.values = metric.values.slice(-this.MAX_METRIC_VALUES / 2);
    }
  }

  private generateMetricKey(
    name: string,
    labels: Record<string, string>,
  ): string {
    const labelString = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return labelString ? `${name}{${labelString}}` : name;
  }

  private generateTimerId(): string {
    return `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility methods for common metrics
  recordOperationSuccess(
    operation: string,
    labels: Record<string, string> = {},
  ): void {
    this.incrementCounter(`${operation}_success_total`, labels);
  }

  recordOperationError(
    operation: string,
    error: Error,
    labels: Record<string, string> = {},
  ): void {
    this.incrementCounter(`${operation}_error_total`, {
      ...labels,
      error_type: error.constructor.name,
    });
  }

  recordCacheHit(cacheType: string, labels: Record<string, string> = {}): void {
    this.incrementCounter('cache_hit_total', {
      ...labels,
      cache_type: cacheType,
    });
  }

  recordCacheMiss(
    cacheType: string,
    labels: Record<string, string> = {},
  ): void {
    this.incrementCounter('cache_miss_total', {
      ...labels,
      cache_type: cacheType,
    });
  }

  recordDatabaseQuery(
    operation: string,
    durationMs: number,
    labels: Record<string, string> = {},
  ): void {
    this.recordDuration(`database_query_${operation}`, durationMs, labels);
    this.incrementCounter('database_query_total', { ...labels, operation });
  }

  recordEventPublished(
    eventType: string,
    labels: Record<string, string> = {},
  ): void {
    this.incrementCounter('event_published_total', {
      ...labels,
      event_type: eventType,
    });
  }

  recordEventProcessed(
    eventType: string,
    durationMs: number,
    labels: Record<string, string> = {},
  ): void {
    this.recordDuration(`event_processing_${eventType}`, durationMs, labels);
    this.incrementCounter('event_processed_total', {
      ...labels,
      event_type: eventType,
    });
  }
}
