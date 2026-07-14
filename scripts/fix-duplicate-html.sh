#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

count=0
for f in *.html; do
  n=$(grep -o "<!DOCTYPE html>" "$f" | wc -l || true)
  if [ -z "$n" ]; then
    n=0
  fi
  if [ "$n" -gt 1 ]; then
    # find line number of second <!DOCTYPE html>
    sec_line=$(grep -n "<!DOCTYPE html>" "$f" | sed -n '2p' | cut -d: -f1)
    if [ -z "$sec_line" ]; then
      echo "Could not determine second doctype line for $f" >&2
      continue
    fi
    keep_lines=$((sec_line - 1))
    if [ "$keep_lines" -lt 1 ]; then
      echo "Unexpected doctype location in $f" >&2
      continue
    fi
    head -n "$keep_lines" "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    echo "Trimmed appended document from $f (kept first $keep_lines lines)"
    count=$((count + 1))
  fi
done

echo "Processed $count files."
