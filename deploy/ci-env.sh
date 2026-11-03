#!/usr/bin/env bash
# deploy.env for a run on GitHub (Coach Milan 3 November 2026, 09:19): the preview and promote workflows have no Cloud Shell
# home, so the settings are built from the project itself. The example's fixed values; the Metrics settings and the Airtable base
# from the running service; the two Firebase web keys from secrets FB_API_KEY and FB_APP_ID if set, else from the Firebase
# project, else from the live page (they are public there anyway). The Metrics salt is masked in the log, never printed.
cd "$(dirname "$0")/.." || exit 1
set -euo pipefail
cp deploy/deploy.env.example deploy/deploy.env
source deploy/deploy.env
# the Metrics settings and the Airtable base, as the running service has them
gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format=json > /tmp/svc.json
python3 - <<'PY' >> deploy/deploy.env
import json, shlex
s = json.load(open("/tmp/svc.json"))
env = {e["name"]: e.get("value", "") for e in s["spec"]["template"]["spec"]["containers"][0].get("env", []) if "value" in e}
for k in ("AIRTABLE_BASE_ID", "METRICS_EMAILS", "METRICS_SALT"):
    print(f"{k}={shlex.quote(env.get(k, ''))}")
PY
SALT=$(bash -c 'source deploy/deploy.env; echo "$METRICS_SALT"'); [ -n "$SALT" ] && echo "::add-mask::$SALT"
[ -n "$SALT" ] || { echo "The running service has no METRICS_SALT; stopping so member numbers don't change."; exit 1; }
# the two Firebase web keys: a secret if set, else the Firebase project, else the live page
KEY="${FB_API_KEY_SECRET:-}"; APP="${FB_APP_ID_SECRET:-}"
if [ -z "$KEY" ] || [ -z "$APP" ]; then
  TOKEN=$(gcloud auth print-access-token)
  H=(-H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: $PROJECT")
  APPNAME=$(curl -sf "${H[@]}" "https://firebase.googleapis.com/v1beta1/projects/$FB_PROJECT_ID/webApps" | python3 -c 'import sys,json; a=json.load(sys.stdin).get("apps",[]); print(a[0]["name"] if a else "")' || true)
  if [ -n "$APPNAME" ]; then
    CFG=$(curl -sf "${H[@]}" "https://firebase.googleapis.com/v1beta1/$APPNAME/config" || true)
    KEY=${KEY:-$(echo "$CFG" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("apiKey",""))' 2>/dev/null || true)}
    APP=${APP:-$(echo "$CFG" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("appId",""))' 2>/dev/null || true)}
  fi
fi
if [ -z "$KEY" ] || [ -z "$APP" ]; then
  for js in $(curl -sfL https://chefmealan.com/ | grep -oE '/assets/[^"]+\.js' | sort -u); do
    BODY=$(curl -sfL "https://chefmealan.com$js" || true)
    KEY=${KEY:-$(echo "$BODY" | grep -oE 'AIza[0-9A-Za-z_-]{35}' | head -1)}
    APP=${APP:-$(echo "$BODY" | grep -oE '1:[0-9]+:web:[0-9a-f]+' | head -1)}
  done
fi
[ -n "$KEY" ] && [ -n "$APP" ] || { echo "The Firebase web keys were not found. Add FB_API_KEY and FB_APP_ID as secrets."; exit 1; }
sed -i "s|^FB_API_KEY=.*|FB_API_KEY=$KEY|; s|^FB_APP_ID=.*|FB_APP_ID=$APP|" deploy/deploy.env
# the example's empty lines for these are dropped, so the values read above win
python3 - <<'PY'
lines = open("deploy/deploy.env").read().splitlines()
seen, out = set(), []
for l in reversed(lines):
    k = l.split("=", 1)[0] if "=" in l and not l.startswith("#") else None
    if k and k in seen: continue
    if k: seen.add(k)
    out.append(l)
open("deploy/deploy.env", "w").write("\n".join(reversed(out)) + "\n")
PY
echo "Settings ready: project $PROJECT, service $SERVICE, Firebase app $APP"
