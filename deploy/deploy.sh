#!/usr/bin/env bash
# Every release: build the image from the current commit and put it live.
set -euo pipefail
cd "$(dirname "$0")"; source ./deploy.env; cd ..
# The Cloud Shell forgets its active account when the session restarts. Pick the signed-in one before anything else.
if [ -z "$(gcloud config get-value account 2>/dev/null)" ]; then
  ACCOUNT=$(gcloud auth list --format='value(account)' 2>/dev/null | head -1)
  [ -n "$ACCOUNT" ] && gcloud config set account "$ACCOUNT" --quiet >/dev/null && echo "Account set: $ACCOUNT"
fi
gcloud config set project "$PROJECT" --quiet >/dev/null
TAG=$(git rev-parse --short HEAD)
IMAGE="$REGION-docker.pkg.dev/$PROJECT/chefmealan/app:$TAG"
gcloud builds submit --project "$PROJECT" --config deploy/cloudbuild.yaml \
  --substitutions "_IMAGE=$IMAGE,_FB_API_KEY=$FB_API_KEY,_FB_AUTH_DOMAIN=$FB_AUTH_DOMAIN,_FB_PROJECT_ID=$FB_PROJECT_ID,_FB_APP_ID=$FB_APP_ID,_FB_DB_ID=$FB_DB_ID,_COMMIT=$TAG" .
SECRETS="GEMINI_API_KEY=gemini-key:latest"
gcloud secrets describe airtable-key --project "$PROJECT" >/dev/null 2>&1 && SECRETS="$SECRETS,AIRTABLE_API_KEY=airtable-key:latest"
gcloud run deploy "$SERVICE" --project "$PROJECT" --region "$REGION" --image "$IMAGE" \
  --allow-unauthenticated --memory 512Mi --max-instances 3 \
  --set-secrets "$SECRETS" --set-env-vars "AIRTABLE_BASE_ID=${AIRTABLE_BASE_ID:-},FIREBASE_PROJECT_ID=$FB_PROJECT_ID,FIRESTORE_DB_ID=$FB_DB_ID"
echo "Live: $(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')  (commit $TAG)"
"$(dirname "$0")/rules.sh" || echo "Rules not published: check the message above, or paste firestore.rules in the Firebase console."
