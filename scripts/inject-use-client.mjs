#!/usr/bin/env node
// Post-build: inject "use client" into business web index files and fix React.createElement alias mismatch.
// tsup/esbuild strips directives and may alias React imports.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const distDir = resolve(import.meta.dirname, '..', 'dist', 'business');
const webIndexFiles = [];

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name === 'index.js' || entry.name === 'index.mjs') {
      const segments = full.split('/');
      const webIdx = segments.lastIndexOf('web');
      if (webIdx > 0 && segments[webIdx - 1] === 'ui') {
        webIndexFiles.push(full);
      }
    }
  }
}

walk(distDir);

let patched = 0;
for (const file of webIndexFiles) {
  let content = readFileSync(file, 'utf8');
  let changed = false;

  // 1. Inject 'use client' if missing
  if (!content.startsWith("'use client'") && !content.startsWith('"use client"')) {
    content = "'use client';\n" + content;
    changed = true;
  }

  // 2. Fix bare React.createElement when import is aliased (e.g. React5)
  //    Pattern: import ReactN from 'react' where N > 0
  //    Classic JSX transform emits React.createElement but React is undefined
  const aliasMatch = content.match(/^import (React\d+),/m);
  if (aliasMatch) {
    const alias = aliasMatch[1];
    // Only replace bare React. (not React5. or other aliases)
    const fixed = content.replace(/(?<!\w)React\.createElement/g, alias + '.createElement');
    if (fixed !== content) {
      content = fixed;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(file, content);
    patched++;
  }
}

if (patched > 0) {
  console.log("[inject-use-client] patched " + patched + " file(s)");
} else {
  console.log("[inject-use-client] no files to patch");
}
