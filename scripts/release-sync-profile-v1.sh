#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'USAGE'
Usage:
  scripts/release-sync-profile-v1.sh [options]

Options:
  --version <patch|minor|major|x.y.z|pre*>   Version bump spec for npm version (default: patch)
  --change-cmd "<command>"                   Optional command to modify sa2kit before release
  --profile-dir <path>                        profile-v1 directory (default: ../profile-v1)
  --profile-dep <name>                        Dependency name in profile-v1 (default: auto detect)
  --publish-tag <latest|beta|next>            npm publish tag (default: latest)
  --profile-build-cmd "<command>"            profile-v1 build command (default: pnpm build)
  --profile-run-cmd "<command>"              profile-v1 run command (default: pnpm dev)
  --no-tests                                  Skip pnpm test before publish
  --no-build                                  Skip pnpm build before publish
  --yes                                       Non-interactive (no prompt)

Examples:
  scripts/release-sync-profile-v1.sh --version patch --yes
  scripts/release-sync-profile-v1.sh --change-cmd "pnpm lint:fix" --version minor
USAGE
}

VERSION_SPEC="patch"
CHANGE_CMD=""
PROFILE_DIR="../profile-v1"
PROFILE_DEP=""
PUBLISH_TAG="latest"
PROFILE_BUILD_CMD="pnpm build"
PROFILE_RUN_CMD="pnpm dev"
SKIP_TESTS=0
SKIP_BUILD=0
AUTO_YES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      VERSION_SPEC="$2"
      shift 2
      ;;
    --change-cmd)
      CHANGE_CMD="$2"
      shift 2
      ;;
    --profile-dir)
      PROFILE_DIR="$2"
      shift 2
      ;;
    --profile-dep)
      PROFILE_DEP="$2"
      shift 2
      ;;
    --publish-tag)
      PUBLISH_TAG="$2"
      shift 2
      ;;
    --profile-build-cmd)
      PROFILE_BUILD_CMD="$2"
      shift 2
      ;;
    --profile-run-cmd)
      PROFILE_RUN_CMD="$2"
      shift 2
      ;;
    --no-tests)
      SKIP_TESTS=1
      shift
      ;;
    --no-build)
      SKIP_BUILD=1
      shift
      ;;
    --yes)
      AUTO_YES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing command: $1" >&2
    exit 1
  }
}

require_cmd git
require_cmd npm
require_cmd pnpm
require_cmd node

PACKAGE_NAME="$(node -p "require('./package.json').name")"
CURRENT_VERSION="$(node -p "require('./package.json').version")"
PROFILE_DIR="$(cd "$ROOT_DIR" && cd "$PROFILE_DIR" && pwd)"

if [[ ! -d "$PROFILE_DIR" ]]; then
  echo "profile-v1 directory not found: $PROFILE_DIR" >&2
  exit 1
fi

if [[ -n "$CHANGE_CMD" ]]; then
  echo "[1/5] Running change command in sa2kit: $CHANGE_CMD"
  bash -lc "$CHANGE_CMD"
else
  echo "[1/5] No change command provided, using current sa2kit workspace state"
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Detected pending changes in sa2kit:"
  git status --short
fi

if [[ $AUTO_YES -ne 1 ]]; then
  read -r -p "Continue release from version $CURRENT_VERSION with spec '$VERSION_SPEC'? [y/N] " answer
  case "$answer" in
    y|Y|yes|YES) ;;
    *) echo "Aborted."; exit 1 ;;
  esac
fi

echo "[2/5] Bumping sa2kit version"
NEW_VERSION="$(npm version "$VERSION_SPEC" --no-git-tag-version | sed 's/^v//')"
echo "Version updated: $CURRENT_VERSION -> $NEW_VERSION"

echo "[2/5] Running release checks"
if [[ $SKIP_TESTS -eq 0 ]]; then
  pnpm test
fi
if [[ $SKIP_BUILD -eq 0 ]]; then
  pnpm build
fi

echo "[3/5] Publishing sa2kit to npm"
if [[ "$PUBLISH_TAG" == "latest" ]]; then
  npm publish --access public
else
  npm publish --tag "$PUBLISH_TAG" --access public
fi

echo "[3/5] Pushing release commit + tag to git"
git add -A
git commit -m "chore(release): v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push origin HEAD
git push origin "v$NEW_VERSION"

echo "[4/5] Updating profile-v1 dependency"
if [[ -z "$PROFILE_DEP" ]]; then
  PROFILE_DEP="$(node -e '
const fs = require("fs");
const p = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
const candidates = ["sa2kit", "@qhr123/sa2kit"];
for (const name of candidates) {
  if ((pkg.dependencies && pkg.dependencies[name]) || (pkg.devDependencies && pkg.devDependencies[name])) {
    console.log(name);
    process.exit(0);
  }
}
console.log("sa2kit");
' "$PROFILE_DIR/package.json")"
fi

echo "profile-v1 dependency key: $PROFILE_DEP"
(
  cd "$PROFILE_DIR"
  pnpm add "${PROFILE_DEP}@${NEW_VERSION}"
)

echo "[5/5] Rebuild and run profile-v1"
(
  cd "$PROFILE_DIR"
  bash -lc "$PROFILE_BUILD_CMD"
  echo "Starting profile-v1 with: $PROFILE_RUN_CMD"
  exec bash -lc "$PROFILE_RUN_CMD"
)
