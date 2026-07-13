#!/usr/bin/env bash
set -euo pipefail

# Resolve merge conflicts automatically by keeping the latest/PR branch version.
#
# Typical use from the repository root:
#   scripts/resolve-conflicts-keep-latest.sh \
#     --base main \
#     --pr codex/build-complete-website-with-distinct-pages-i0mg6f \
#     --push
#
# What it does:
#   1. Fetches origin.
#   2. Checks out and updates the base branch.
#   3. Merges the PR branch into the base branch.
#   4. For every conflicted file, keeps the PR branch version (--theirs).
#   5. Stages all resolutions, commits the merge, and optionally pushes.
#
# Safety notes:
#   - Run this only when you intentionally want the PR branch version for every
#     conflicting file.
#   - Non-conflicting changes from both branches are preserved by Git's merge.
#   - If you are already inside a conflicted merge and only want to resolve the
#     current conflicts, use:
#       scripts/resolve-conflicts-keep-latest.sh --resolve-current --side theirs

BASE_BRANCH="main"
PR_BRANCH=""
REMOTE="origin"
PUSH_AFTER=0
RESOLVE_CURRENT=0
SIDE="theirs"
COMMIT_MESSAGE=""

usage() {
  sed -n '3,24p' "$0"
  cat <<USAGE

Options:
  --base <branch>          Base branch to merge into. Default: main
  --pr <branch>            PR branch name or remote ref to merge. Required unless --resolve-current is used.
  --remote <name>          Git remote name. Default: origin
  --side <ours|theirs>     Side to keep for conflicted files. Default: theirs
                           When merging PR into base, 'theirs' means PR branch.
  --resolve-current        Do not checkout/fetch/merge; only resolve the current conflicted merge.
  --message <text>         Custom merge commit message.
  --push                   Push the resulting branch to the configured remote.
  -h, --help               Show this help.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base) BASE_BRANCH="${2:?Missing value for --base}"; shift 2 ;;
    --pr) PR_BRANCH="${2:?Missing value for --pr}"; shift 2 ;;
    --remote) REMOTE="${2:?Missing value for --remote}"; shift 2 ;;
    --side) SIDE="${2:?Missing value for --side}"; shift 2 ;;
    --resolve-current) RESOLVE_CURRENT=1; shift ;;
    --message) COMMIT_MESSAGE="${2:?Missing value for --message}"; shift 2 ;;
    --push) PUSH_AFTER=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ "$SIDE" != "ours" && "$SIDE" != "theirs" ]]; then
  echo "ERROR: --side must be 'ours' or 'theirs'." >&2
  exit 2
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

if [[ "$RESOLVE_CURRENT" -eq 0 && -z "$PR_BRANCH" ]]; then
  echo "ERROR: --pr is required unless --resolve-current is used." >&2
  usage
  exit 2
fi

if [[ "$RESOLVE_CURRENT" -eq 0 ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "ERROR: Working tree is not clean. Commit/stash changes first, or use --resolve-current during an active conflicted merge." >&2
    git status --short
    exit 1
  fi

  git fetch "$REMOTE"
  git checkout "$BASE_BRANCH"
  git pull --ff-only "$REMOTE" "$BASE_BRANCH"

  pr_ref="$PR_BRANCH"
  if git show-ref --verify --quiet "refs/remotes/$REMOTE/$PR_BRANCH"; then
    pr_ref="$REMOTE/$PR_BRANCH"
  fi

  set +e
  git merge --no-ff --no-commit "$pr_ref"
  merge_status=$?
  set -e

  if [[ "$merge_status" -ne 0 ]]; then
    echo "Merge reported conflicts. Resolving conflicted files by keeping --$SIDE." >&2
  fi
else
  if ! git rev-parse -q --verify MERGE_HEAD >/dev/null; then
    echo "ERROR: --resolve-current requires an active conflicted merge." >&2
    exit 1
  fi
fi

mapfile -d '' conflicted_files < <(git diff --name-only --diff-filter=U -z)

if [[ "${#conflicted_files[@]}" -gt 0 ]]; then
  printf 'Resolving %d conflicted file(s) using --%s...\n' "${#conflicted_files[@]}" "$SIDE"
  for path in "${conflicted_files[@]}"; do
    echo "  $path"
    if ! git checkout "--$SIDE" -- "$path" 2>/dev/null; then
      # If the selected side deleted the path, checkout has no blob to restore.
      git rm -f -- "$path" >/dev/null 2>&1 || true
    fi
    git add -A -- "$path"
  done
fi

remaining_conflicts="$(git diff --name-only --diff-filter=U)"
if [[ -n "$remaining_conflicts" ]]; then
  echo "ERROR: Some conflicts remain:" >&2
  echo "$remaining_conflicts" >&2
  exit 1
fi

# Stage non-conflicting merge results too.
git add -A

if git diff --cached --quiet; then
  echo "No staged changes to commit. Nothing to do."
else
  if [[ -z "$COMMIT_MESSAGE" ]]; then
    if [[ "$RESOLVE_CURRENT" -eq 1 ]]; then
      COMMIT_MESSAGE="Resolve merge conflicts by keeping $SIDE"
    else
      COMMIT_MESSAGE="Merge $PR_BRANCH into $BASE_BRANCH keeping PR conflict versions"
    fi
  fi
  git commit -m "$COMMIT_MESSAGE"
fi

if [[ "$PUSH_AFTER" -eq 1 ]]; then
  current_branch="$(git branch --show-current)"
  git push "$REMOTE" "$current_branch"
fi

echo "Done. Current status:"
git status --short --branch
