#!/usr/bin/env node
const { ESLint } = require('eslint');
const fs = require('fs');

(async () => {
  try {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(['src/**/*.ts']);

    const ruleCounts = Object.create(null);
    const ruleFiles = Object.create(null);

    for (const r of results) {
      for (const m of r.messages) {
        const id = m.ruleId || 'unknown';
        ruleCounts[id] = (ruleCounts[id] || 0) + 1;
        ruleFiles[id] = ruleFiles[id] || Object.create(null);
        ruleFiles[id][r.filePath] = (ruleFiles[id][r.filePath] || 0) + 1;
      }
    }

    const summary = Object.keys(ruleCounts)
      .map((ruleId) => ({
        ruleId,
        count: ruleCounts[ruleId],
        topFiles: Object.entries(ruleFiles[ruleId] || {})
          .map(([filePath, count]) => ({ filePath, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      }))
      .sort((a, b) => b.count - a.count);

    fs.writeFileSync(
      'eslint-rule-stats.json',
      JSON.stringify({ summary }, null, 2),
    );
    console.log(JSON.stringify({ top: summary.slice(0, 10) }, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
