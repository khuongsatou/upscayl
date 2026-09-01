#!/bin/bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.mtips5s.upscayl-local-worker"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/$LABEL.plist"
LOG_DIR="$HOME/Library/Logs/mtips5s-upscale"
PORT="${UPSCAYL_LOCAL_MAC_PORT:-3047}"
NPM_BIN="$(command -v npm || true)"

write_plist() {
  mkdir -p "$PLIST_DIR" "$LOG_DIR"
  [ -n "$NPM_BIN" ] || { echo "npm is required" >&2; exit 1; }
  cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>$LABEL</string>
<key>WorkingDirectory</key><string>$ROOT_DIR</string>
<key>ProgramArguments</key><array><string>$NPM_BIN</string><string>run</string><string>web:start</string><string>--</string><string>-H</string><string>127.0.0.1</string><string>-p</string><string>$PORT</string></array>
<key>EnvironmentVariables</key><dict>
<key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
<key>NODE_ENV</key><string>production</string><key>UPSCAYL_TARGET</key><string>web</string><key>UPSCAYL_WEB_BASE_PATH</key><string>/upscale</string>
<key>UPSCAYL_API_ALLOW_ANONYMOUS_WEB</key><string>false</string><key>UPSCAYL_API_ALLOW_LOCAL_MAC_BRIDGE</key><string>true</string>
<key>UPSCAYL_API_LOCAL_MAC_BRIDGE_ORIGINS</key><string>https://bb.1nutnhan.com,http://127.0.0.1:3047,http://localhost:3047</string>
<key>UPSCAYL_API_DATA_DIR</key><string>$HOME/Library/Application Support/mtips5s-upscale-api</string><key>UPSCAYL_API_MAX_OUTPUT_PIXELS</key><string>50000000</string>
</dict><key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>StandardOutPath</key><string>$LOG_DIR/worker.log</string><key>StandardErrorPath</key><string>$LOG_DIR/worker.error.log</string></dict></plist>
EOF
}
case "${1:-}" in
  install) command -v npm >/dev/null || { echo "npm is required" >&2; exit 1; }; write_plist; npm run web:build:upscale; launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true; launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"; launchctl kickstart -k "gui/$(id -u)/$LABEL"; echo "Installed on http://127.0.0.1:$PORT/upscale/api/v1" ;;
  start) [ -f "$PLIST_PATH" ] || { echo "Worker is not installed. Run: $0 install" >&2; exit 1; }; launchctl kickstart -k "gui/$(id -u)/$LABEL" ;;
  stop) launchctl kill SIGTERM "gui/$(id -u)/$LABEL" 2>/dev/null || true ;;
  restart) "$0" stop; "$0" start ;;
  status) launchctl print "gui/$(id -u)/$LABEL" >/dev/null 2>&1 || { echo "Worker is not installed or not loaded"; exit 1; }; curl -fsS "http://127.0.0.1:$PORT/upscale/api/v1/health"; echo ;;
  uninstall) launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true; rm -f "$PLIST_PATH"; echo "Uninstalled (data/logs retained)" ;;
  *) echo "Usage: $0 install|start|stop|restart|status|uninstall"; exit 2 ;;
esac
