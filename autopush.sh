#!/bin/bash

echo "⚡️ Change detected! Syncing with GitHub..."

# 1. Stage all changes and new files
git add .

# 2. Commit with a timestamp
git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"

# 3. Automatically detect current branch and push
git push origin $(git rev-parse --abbrev-ref HEAD)

echo "✅ Sync complete. Watching for next save..."

