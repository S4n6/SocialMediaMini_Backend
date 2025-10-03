#!/usr/bin/env node
const { ESLint } = require('eslint');
const fs = require('fs');

(async () => {
  try {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(['src/shared/websocket/**/*.ts']);
    fs.writeFileSync('eslint-ws-report.json', JSON.stringify(results, null, 2));
    const summary = results
      .map((r) => ({
        filePath: r.filePath,
        errors: r.errorCount,
        warnings: r.warningCount,
      }))
      .sort((a, b) => b.errors - a.errors || b.warnings - a.warnings);
    console.log(
      JSON.stringify({ summary, totalFiles: results.length }, null, 2),
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
