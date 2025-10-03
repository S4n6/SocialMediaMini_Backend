#!/usr/bin/env node
const { ESLint } = require('eslint');

(async () => {
  try {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(['src/**/*.ts']);
    let errors = 0;
    let warnings = 0;
    for (const r of results) {
      errors += r.errorCount || 0;
      warnings += r.warningCount || 0;
    }
    console.log(JSON.stringify({ errors, warnings }, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
