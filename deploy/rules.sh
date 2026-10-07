#!/usr/bin/env bash
# Publish firestore.rules to the app's database and storage.rules to the photo files. Runs with every release, so rules and code never drift apart.
set -euo pipefail
cd "$(dirname "$0")"; source ./deploy.env; cd ..
TOKEN=$(gcloud auth print-access-token)
H=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "x-goog-user-project: $PROJECT")
BODY=$(python3 -c 'import json;print(json.dumps({"source":{"files":[{"name":"firestore.rules","content":open("firestore.rules").read()}]}}))')
RULESET=$(curl -sf "${H[@]}" -X POST "https://firebaserules.googleapis.com/v1/projects/$PROJECT/rulesets" -d "$BODY" | python3 -c 'import sys,json;print(json.load(sys.stdin)["name"])')
REL="projects/$PROJECT/releases/cloud.firestore/$FB_DB_ID"
curl -sf "${H[@]}" -X PATCH "https://firebaserules.googleapis.com/v1/$REL" -d "{\"release\":{\"name\":\"$REL\",\"rulesetName\":\"$RULESET\"}}" >/dev/null \
  || curl -sf "${H[@]}" -X POST "https://firebaserules.googleapis.com/v1/projects/$PROJECT/releases" -d "{\"name\":\"$REL\",\"rulesetName\":\"$RULESET\"}" >/dev/null
echo "Rules published: $RULESET"

# Photos as files (storage release 1): the same for the bucket
BUCKET="${STORAGE_BUCKET:-$FB_PROJECT_ID.firebasestorage.app}"
BODY=$(python3 -c 'import json;print(json.dumps({"source":{"files":[{"name":"storage.rules","content":open("storage.rules").read()}]}}))')
RULESET=$(curl -sf "${H[@]}" -X POST "https://firebaserules.googleapis.com/v1/projects/$PROJECT/rulesets" -d "$BODY" | python3 -c 'import sys,json;print(json.load(sys.stdin)["name"])')
REL="projects/$PROJECT/releases/firebase.storage/$BUCKET"
curl -sf "${H[@]}" -X PATCH "https://firebaserules.googleapis.com/v1/$REL" -d "{\"release\":{\"name\":\"$REL\",\"rulesetName\":\"$RULESET\"}}" >/dev/null \
  || curl -sf "${H[@]}" -X POST "https://firebaserules.googleapis.com/v1/projects/$PROJECT/releases" -d "{\"name\":\"$REL\",\"rulesetName\":\"$RULESET\"}" >/dev/null
echo "Photo rules published: $RULESET"
