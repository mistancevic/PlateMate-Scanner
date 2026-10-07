#!/usr/bin/env bash
# Step 1 of a careful release: build the current commit and put it on its own preview link. Nobody else gets it:
# chefmealan.com keeps serving what it served. Check the preview on your phone, then run ./deploy/promote.sh.
# The preview uses the real accounts and data, so sign in as yourself.
set -euo pipefail
cd "$(dirname "$0")"; source ./deploy.env; cd ..
source deploy/build.sh
source deploy/live.sh
gcloud run deploy "$SERVICE" --project "$PROJECT" --region "$REGION" --image "$IMAGE" \
  --allow-unauthenticated --memory 512Mi --max-instances 3 --revision-suffix "$SUFFIX" \
  --set-secrets "$SECRETS" --set-env-vars "$ENVS" --no-traffic --tag preview
URL=$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format=json \
  | python3 -c 'import sys,json; t=json.load(sys.stdin)["status"].get("traffic",[]); print(next((x.get("url","") for x in t if x.get("tag")=="preview"), ""))')
# Sign-in only works on addresses Firebase knows: add the preview's address once (needs an owner of the project)
HOST="${URL#https://}"
TOKEN=$(gcloud auth print-access-token)
CFG="https://identitytoolkit.googleapis.com/admin/v2/projects/$FB_PROJECT_ID/config"
H=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "x-goog-user-project: $FB_PROJECT_ID")
ASK="Sign-in on the preview: add $HOST in Firebase console, Authentication, Settings, Authorized domains (once)."
if [ -n "$HOST" ]; then
  CUR=$(curl -sf "${H[@]}" "$CFG" || true)
  if [ -z "$CUR" ]; then echo "$ASK"
  else
    BODY=$(echo "$CUR" | python3 -c 'import sys,json; d=json.load(sys.stdin).get("authorizedDomains",[]); h=sys.argv[1]; print("" if h in d else json.dumps({"authorizedDomains": d+[h]}))' "$HOST")
    if [ -n "$BODY" ]; then curl -sf "${H[@]}" -X PATCH "$CFG?updateMask=authorizedDomains" -d "$BODY" >/dev/null && echo "Sign-in allowed on the preview address." || echo "$ASK"; fi
  fi
fi
echo "Preview: $URL  (commit $TAG, version $VERSION)"
echo "chefmealan.com still serves $(commit_of "$(live_revision)"). When the preview looks right: ./deploy/promote.sh"
