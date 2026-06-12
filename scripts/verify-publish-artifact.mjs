#!/usr/bin/env node
/**
 * 发布前校验：dist 与 npm pack tarball 必须包含 business 产物。
 * 防止 prepare 在 pack 阶段误跑 build:common（clean）导致 tarball 缺 business。
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const REQUIRED_DIST = [
  'dist/common/components/index.js',
  'dist/common/file/server/index.js',
  'dist/business/mmd/index.js',
  'dist/business/music/server/index.js',
];

const REQUIRED_TARBALL_PREFIXES = [
  'dist/business/mmd/index.js',
  'dist/common/components/index.js',
];

function assertDistArtifacts() {
  const missing = REQUIRED_DIST.filter((rel) => !existsSync(join(root, rel)));
  if (missing.length > 0) {
    console.error('✗ dist missing required artifacts:');
    for (const rel of missing) console.error(`  - ${rel}`);
    process.exit(1);
  }
  console.log(`✓ dist contains ${REQUIRED_DIST.length} required artifacts`);
}

function assertTarballArtifacts() {
  const tarballName = `${pkg.name}-${pkg.version}.tgz`;
  const tarballPath = join(root, tarballName);

  if (existsSync(tarballPath)) {
    unlinkSync(tarballPath);
  }

  execSync('npm pack --silent', { cwd: root, stdio: 'pipe' });

  if (!existsSync(tarballPath)) {
    console.error(`✗ npm pack did not create ${tarballName}`);
    process.exit(1);
  }

  const listing = execSync(`tar tzf ${JSON.stringify(tarballPath)}`, {
    encoding: 'utf8',
  });

  const missing = REQUIRED_TARBALL_PREFIXES.filter(
    (prefix) => !listing.includes(`package/${prefix}`),
  );

  if (missing.length > 0) {
    console.error(`✗ ${tarballName} missing:`);
    for (const rel of missing) console.error(`  - ${rel}`);
    process.exit(1);
  }

  console.log(`✓ ${tarballName} includes business + common dist`);
}

assertDistArtifacts();
assertTarballArtifacts();
