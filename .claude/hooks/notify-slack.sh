#!/bin/bash
# Claude Code hook -> Slack Incoming Webhook notifier.
# Registered under `hooks.Notification` (matcher: permission_prompt) and `hooks.Stop` in settings.local.json.
# Always exits 0: a Stop hook that exits 2 blocks Claude from finishing, which we never want here.

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$script_dir/.env" ]; then
  set -a
  source "$script_dir/.env"
  set +a
fi
webhook_url="${SLACK_WEBHOOK_URL:-$1}"
input="$(cat)"

project="$(basename "$(printf '%s' "$input" | jq -r '.cwd // env.CLAUDE_PROJECT_DIR // "unknown"')")"
event="$(printf '%s' "$input" | jq -r '.hook_event_name // "unknown"')"

case "$event" in
  Notification)
    text="🔐 [$project] 권한 승인 필요"
    ;;
  Stop)
    text="✅ [$project] 작업 완료"
    ;;
  *)
    text="ℹ️ [$project] Claude Code 이벤트: $event"
    ;;
esac

if [ -n "$webhook_url" ]; then
  payload="$(jq -n --arg text "$text" --arg username "Claude Code" --arg icon ":robot_face:" \
    '{text: $text, username: $username, icon_emoji: $icon}')"
  printf '%s' "$payload" | curl -s -X POST -H 'Content-Type: application/json' --data-binary @- "$webhook_url" > /dev/null 2>&1
fi

exit 0
