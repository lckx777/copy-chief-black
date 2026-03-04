/**
 * Transpile TypeScript hooks and copy-chief modules to JavaScript
 * Uses esbuild for fast, Bun-compatible transpilation
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const platform = require('../lib/platform');

function transpileDir(dir, opts = {}) {
  if (!fs.existsSync(dir)) return { files: 0, errors: [] };

  const tsFiles = findTsFiles(dir);
  const errors = [];
  let count = 0;

  // Check for esbuild
  let esbuildPath;
  try {
    esbuildPath = require.resolve('esbuild');
  } catch {
    // Try hooks node_modules
    const hooksEsbuild = path.join(platform.hooksDir(), 'node_modules', '.bin', 'esbuild');
    if (fs.existsSync(hooksEsbuild)) {
      esbuildPath = hooksEsbuild;
    } else {
      // Install esbuild locally
      console.log('  Installing esbuild...');
      try {
        execSync('npm install --save-dev esbuild', { cwd: dir, stdio: 'pipe' });
        esbuildPath = path.join(dir, 'node_modules', '.bin', 'esbuild');
      } catch (e) {
        return { files: 0, errors: [`Failed to install esbuild: ${e.message}`] };
      }
    }
  }

  for (const tsFile of tsFiles) {
    const jsFile = tsFile.replace(/\.ts$/, '.js');

    // Skip if .js is newer than .ts
    if (!opts.force && fs.existsSync(jsFile)) {
      const tsStat = fs.statSync(tsFile);
      const jsStat = fs.statSync(jsFile);
      if (jsStat.mtimeMs > tsStat.mtimeMs) continue;
    }

    try {
      // Transpile with esbuild — fast, handles Bun-style imports
      const esbuildBin = path.join(path.dirname(esbuildPath || ''), '..', '.bin', 'esbuild');
      const realBin = fs.existsSync(esbuildBin) ? esbuildBin : 'npx esbuild';

      execSync(
        `${realBin} "${tsFile}" --outfile="${jsFile}" --format=cjs --platform=node --target=node18`,
        { cwd: dir, stdio: 'pipe' }
      );

      // Post-process: fix .ts require paths and shebang
      postProcessJs(jsFile);
      count++;
    } catch (e) {
      // Fallback: simple strip-types transpilation
      try {
        const content = fs.readFileSync(tsFile, 'utf8');
        const stripped = stripTypes(content);
        fs.writeFileSync(jsFile, stripped, 'utf8');
        count++;
      } catch (e2) {
        errors.push(`${path.basename(tsFile)}: ${e2.message}`);
      }
    }
  }

  return { files: count, errors };
}

/**
 * Post-process transpiled JS:
 * 1. Replace .ts extensions in require() paths with .js
 * 2. Replace #!/usr/bin/env bun shebang with node
 */
function postProcessJs(jsFile) {
  let content = fs.readFileSync(jsFile, 'utf8');
  let changed = false;

  // Fix shebang: bun → node
  if (content.startsWith('#!/usr/bin/env bun')) {
    content = content.replace('#!/usr/bin/env bun', '#!/usr/bin/env node');
    changed = true;
  }

  // Fix .ts extensions in require paths → .js
  const tsRequireRe = /require\(["']([^"']*?)\.ts["']\)/g;
  if (tsRequireRe.test(content)) {
    content = content.replace(tsRequireRe, (_, mod) => `require("${mod}.js")`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(jsFile, content, 'utf8');
  }
}

function findTsFiles(dir) {
  const results = [];
  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === 'compiled') continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.ts') && !e.name.endsWith('.d.ts')) results.push(full);
    }
  }
  walk(dir);
  return results;
}

/**
 * Simple type-stripping for TypeScript → JavaScript
 * Handles: type annotations, interfaces, type imports, generics
 */
function stripTypes(code) {
  let result = code;

  // Remove shebang
  result = result.replace(/^#!.*\n/, '');

  // Remove type-only imports
  result = result.replace(/^import\s+type\s+.*;\s*$/gm, '');

  // Convert import { type X, Y } to import { Y }
  result = result.replace(/import\s*\{([^}]+)\}/g, (match, imports) => {
    const cleaned = imports
      .split(',')
      .filter(i => !i.trim().startsWith('type '))
      .join(',');
    return cleaned.trim() ? `import {${cleaned}}` : '';
  });

  // Remove interface/type declarations
  result = result.replace(/^(export\s+)?(interface|type)\s+\w+[^{]*\{[^}]*\}\s*$/gm, '');

  // Remove type annotations from variables: `: Type`
  result = result.replace(/:\s*(string|number|boolean|void|any|null|undefined|unknown|never|Record<[^>]+>|Array<[^>]+>|\w+\[\]|{\s*[^}]*})\s*([=;,)])/g, '$2');

  // Remove return type annotations
  result = result.replace(/\):\s*\w+(\[\])?\s*\{/g, ') {');
  result = result.replace(/\):\s*\w+(\[\])?\s*=>/g, ') =>');

  // Remove generic type params
  result = result.replace(/<[A-Z]\w*(\s*,\s*[A-Z]\w*)*>/g, '');

  // Remove `as Type` casts
  result = result.replace(/\s+as\s+\w+(\[\])?/g, '');

  // Convert `import ... from '../module.ts'` to `require`
  result = result.replace(/import\s+(\{[^}]+\})\s+from\s+['"]([^'"]+)['"]\s*;?/g, (_, imports, mod) => {
    const cleanMod = mod.replace(/\.ts$/, '');
    const names = imports.replace(/[{}]/g, '').trim();
    return `const ${imports.replace(/[{}]/g, '').trim().includes(',') ? `{ ${names} }` : names} = require('${cleanMod}');`;
  });

  // Convert default imports
  result = result.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, (_, name, mod) => {
    const cleanMod = mod.replace(/\.ts$/, '');
    return `const ${name} = require('${cleanMod}');`;
  });

  return result;
}

async function transpileAll(opts = {}) {
  console.log('Transpiling TypeScript files...\n');

  // 1. Hooks
  const hooksResult = transpileDir(platform.hooksDir(), opts);
  console.log(`  Hooks: ${hooksResult.files} transpiled`);
  if (hooksResult.errors.length) {
    for (const e of hooksResult.errors) console.log(`    ⚠️  ${e}`);
  }

  // 2. Copy-chief modules
  const ccResult = transpileDir(platform.copyChiefDir(), opts);
  console.log(`  Copy-chief: ${ccResult.files} transpiled`);
  if (ccResult.errors.length) {
    for (const e of ccResult.errors) console.log(`    ⚠️  ${e}`);
  }

  const totalErrors = hooksResult.errors.length + ccResult.errors.length;
  const total = hooksResult.files + ccResult.files;
  console.log(`\n${totalErrors === 0 ? '✅' : '⚠️ '} ${total} files transpiled, ${totalErrors} errors`);

  return totalErrors === 0;
}

module.exports = { transpileDir, transpileAll, stripTypes };
