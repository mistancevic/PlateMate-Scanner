#!/usr/bin/env bash
# Which web addresses may read photos back from the photo bucket (CORS). chefmealan.com always; the preview link and the
# service's own run.app address too, or a phone on the preview can send photos but never fetch them (found 7 October 2026).
# Run by build.sh and preview.sh; safe to run alone: ./deploy/cors.sh
cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1; source ./deploy.env; cd .. || exit 1
BUCKET="${STORAGE_BUCKET:-$FB_PROJECT_ID.firebasestorage.app}"
URLS=$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format=json 2>/dev/null \
  | python3 -c 'import sys,json
try: s=json.load(sys.stdin)["status"]
except Exception: s={}
print(" ".join([s.get("url","")]+[t.get("url","") for t in s.get("traffic",[]) if t.get("url")]))' 2>/dev/null)
FILE=$(mktemp)
python3 - "$FILE" $URLS <<'PY'
import json, sys
base = json.load(open("deploy/cors.json"))
extra = [u for u in sys.argv[2:] if u.startswith("https://")]
for rule in base: rule["origin"] = sorted(set(rule["origin"] + extra))
json.dump(base, open(sys.argv[1], "w"))
PY
if gcloud storage buckets update "gs://$BUCKET" --cors-file="$FILE" --quiet >/dev/null 2>&1; then
  echo "Photos can be read on: $(python3 -c 'import json,sys; print(", ".join(json.load(open(sys.argv[1]))[0]["origin"]))' "$FILE")"
else
  echo "Photo storage: CORS not set (check that the bucket $BUCKET exists)"
fi
rm -f "$FILE"
