import { Injectable, Logger } from '@nestjs/common';
import {
  IErrorInfo,
  ErrorSeverity,
  ErrorCategory,
} from '../exceptions/error-response.interface';

/**
 * Service for monitoring and reporting errors to external services
 */
@Injectable()
export class ErrorMonitoringService {
  private readonly logger = new Logger(ErrorMonitoringService.name);

  /**
   * Report error to monitoring services
   */
  async reportError(errorInfo: IErrorInfo): Promise<void> {
    try {
      // Log locally first
      this.logErrorLocally(errorInfo);

      // Report to external services based on configuration
      await Promise.allSettled([
        this.reportToSentry(errorInfo),
        this.reportToDatadog(errorInfo),
        this.reportToSlack(errorInfo),
        this.saveToDatabase(errorInfo),
      ]);
    } catch (error) {
      this.logger.error('Failed to report error to monitoring services', {
        originalError: errorInfo.response.requestId,
        monitoringError: error.message,
      });
    }
  }

  /**
   * Log error locally with structured format
   */
  private logErrorLocally(errorInfo: IErrorInfo): void {
    const { response, severity, category, context, originalError } = errorInfo;

    const logData = {
      requestId: response.requestId,
      statusCode: response.statusCode,
      errorCode: response.code,
      message: response.message,
      path: response.path,
      severity,
      category,
      timestamp: response.timestamp,
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      method: context.method,
      url: context.url,
      stack: originalError?.stack,
    };

    switch (severity) {
      case ErrorSeverity.LOW:
        this.logger.warn(`[${category}] ${response.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.error(`[${category}] ${response.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        this.logger.error(
          `[CRITICAL][${category}] ${response.message}`,
          logData,
        );
        break;
    }
  }

  /**
   * Report error to Sentry (placeholder implementation)
   */
  private async reportToSentry(errorInfo: IErrorInfo): Promise<void> {
    if (!this.shouldReportToSentry(errorInfo)) return Promise.resolve();

    // Placeholder implementation: log and return resolved promise
    this.logger.debug('Would report to Sentry', {
      requestId: errorInfo.response.requestId,
      category: errorInfo.category,
      severity: errorInfo.severity,
    });

    return Promise.resolve();
  }

  /**
   * Report error metrics to Datadog (placeholder implementation)
   */
  private async reportToDatadog(errorInfo: IErrorInfo): Promise<void> {
    if (!this.shouldReportToDatadog(errorInfo)) return Promise.resolve();

    // Placeholder implementation
    this.logger.debug('Would report to Datadog', {
      requestId: errorInfo.response.requestId,
      metric: 'errors.total',
      tags: {
        category: errorInfo.category,
        severity: errorInfo.severity,
        status_code: errorInfo.response.statusCode,
      },
    });

    return Promise.resolve();
  }

  /**
   * Send critical errors to Slack (placeholder implementation)
   */
  private async reportToSlack(errorInfo: IErrorInfo): Promise<void> {
    if (!this.shouldReportToSlack(errorInfo)) return Promise.resolve();

    const slackMessage = this.formatSlackMessage(errorInfo);

    // Placeholder implementation
    this.logger.debug('Would send to Slack', {
      requestId: errorInfo.response.requestId,
      message: slackMessage.text,
    });

    return Promise.resolve();
  }

  /**
   * Save error to database for analysis (placeholder implementation)
   */
  private async saveToDatabase(errorInfo: IErrorInfo): Promise<void> {
    if (!this.shouldSaveToDatabase(errorInfo)) return Promise.resolve();

    // Placeholder implementation
    this.logger.debug('Would save to database', {
      requestId: errorInfo.response.requestId,
      table: 'error_logs',
    });

    return Promise.resolve();
  }

  /**
   * Determine if error should be reported to Sentry
   */
  private shouldReportToSentry(errorInfo: IErrorInfo): boolean {
    return !!(
      process.env.SENTRY_DSN &&
      errorInfo.shouldReport &&
      (errorInfo.severity === ErrorSeverity.HIGH ||
        errorInfo.severity === ErrorSeverity.CRITICAL)
    );
  }

  /**
   * Determine if error should be reported to Datadog
   */
  private shouldReportToDatadog(errorInfo: IErrorInfo): boolean {
    return !!(
      process.env.DATADOG_API_KEY && errorInfo.severity !== ErrorSeverity.LOW
    );
  }

  /**
   * Determine if error should be sent to Slack
   */
  private shouldReportToSlack(errorInfo: IErrorInfo): boolean {
    return !!(
      process.env.SLACK_WEBHOOK_URL &&
      errorInfo.severity === ErrorSeverity.CRITICAL &&
      errorInfo.category !== ErrorCategory.VALIDATION
    );
  }

  /**
   * Determine if error should be saved to database
   */
  private shouldSaveToDatabase(errorInfo: IErrorInfo): boolean {
    return (
      process.env.ENABLE_ERROR_DB_LOGGING === 'true' &&
      errorInfo.severity !== ErrorSeverity.LOW
    );
  }

  /**
   * Format error message for Slack
   */
  private formatSlackMessage(errorInfo: IErrorInfo): any {
    const { response, severity, category, context } = errorInfo;

    const color = severity === ErrorSeverity.CRITICAL ? 'danger' : 'warning';

    return {
      text: `🚨 ${severity.toUpperCase()} Error Alert`,
      attachments: [
        {
          color,
          title: `${category.toUpperCase()}: ${response.message}`,
          fields: [
            {
              title: 'Request ID',
              value: response.requestId,
              short: true,
            },
            {
              title: 'Status Code',
              value: response.statusCode,
              short: true,
            },
            {
              title: 'Path',
              value: response.path,
              short: true,
            },
            {
              title: 'User ID',
              value: context.userId || 'Anonymous',
              short: true,
            },
            {
              title: 'IP Address',
              value: context.ipAddress,
              short: true,
            },
            {
              title: 'Timestamp',
              value: response.timestamp,
              short: true,
            },
          ],
          footer: 'Error Monitoring System',
          ts: Math.floor(new Date(response.timestamp).getTime() / 1000),
        },
      ],
    };
  }

  /**
   * Get error statistics for dashboard/reporting
   */
  async getErrorStats(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    topErrorCodes: Array<{ code: string; count: number }>;
  }> {
    // TODO: Implement actual statistics gathering from database
    // This is a placeholder implementation
    return {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      topErrorCodes: [],
    };
  }

  /**
   * Check system health based on error rates
   */
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    errorRate: number;
    criticalErrors: number;
    recommendations: string[];
  }> {
    // TODO: Implement actual health checking logic
    // This could analyze error rates, patterns, and provide recommendations
    return {
      status: 'healthy',
      errorRate: 0,
      criticalErrors: 0,
      recommendations: [],
    };
  }
}
