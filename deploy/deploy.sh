#!/usr/bin/env bash
# Every release: build the image from the current commit and put it live.
set -euo pipefail
cd "$(dirname "$0")"; source ./deploy.env; cd ..
TAG=$(git rev-parse --short HEAD)
IMAGE="$REGION-docker.pkg.dev/$PROJECT/chefmealan/app:$TAG"
gcloud builds submit --project "$PROJECT" --config deploy/cloudbuild.yaml \
  --substitutions "_IMAGE=$IMAGE,_FB_API_KEY=$FB_API_KEY,_FB_AUTH_DOMAIN=$FB_AUTH_DOMAIN,_FB_PROJECT_ID=$FB_PROJECT_ID,_FB_APP_ID=$FB_APP_ID,_FB_DB_ID=$FB_DB_ID" .
SECRETS="GEMINI_API_KEY=gemini-key:latest"
gcloud secrets describe airtable-key --project "$PROJECT" >/dev/null 2>&1 && SECRETS="$SECRETS,AIRTABLE_API_KEY=airtable-key:latest"
gcloud run deploy "$SERVICE" --project "$PROJECT" --region "$REGION" --image "$IMAGE" \
  --allow-unauthenticated --memory 512Mi --max-instances 3 \
  --set-secrets "$SECRETS" --set-env-vars "AIRTABLE_BASE_ID=${AIRTABLE_BASE_ID:-},FIREBASE_PROJECT_ID=$FB_PROJECT_ID,FIRESTORE_DB_ID=$FB_DB_ID"
echo "Live: $(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')  (commit $TAG)"
