#!/bin/zsh
LOCKFILE="/tmp/gemini_ex.lock"

# Check if another instance is already running
if [ -e "$LOCKFILE" ]; then
    PID=$(cat "$LOCKFILE" 2>/dev/null)
    if kill -0 "$PID" 2>/dev/null; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Another /gemini-ex task is already running (PID: $PID). Skipping this cycle."
        exit 0
    fi
fi

# Acquire lock
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT INT TERM

cd /Users/dayyoung/project/snshero || exit 1
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting /gemini-ex automated run..."

# Pull latest changes first
git pull --rebase origin main >> launchd_gemini_ex.log 2>&1

# Run Antigravity Headless
/Users/dayyoung/.local/bin/agy -p "/gemini-ex" --dangerously-skip-permissions >> launchd_gemini_ex.log 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] /gemini-ex run finished."
