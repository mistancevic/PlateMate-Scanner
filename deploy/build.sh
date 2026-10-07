#!/usr/bin/env bash
# Shared by deploy.sh and preview.sh (sourced, not run): build the image from the current commit, set up the photo bucket,
# and prepare what the service needs. Leaves IMAGE, TAG, SUFFIX, BUCKET, SECRETS and ENVS for the caller.
cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1; source ./deploy.env; cd .. || exit 1
# The Cloud Shell forgets its active account when the session restarts. Pick the signed-in one before anything else.
if [ -z "$(gcloud config get-value account 2>/dev/null)" ]; then
  ACCOUNT=$(gcloud auth list --format='value(account)' 2>/dev/null | head -1)
  [ -n "$ACCOUNT" ] && gcloud config set account "$ACCOUNT" --quiet >/dev/null && echo "Account set: $ACCOUNT"
fi
gcloud config set project "$PROJECT" --quiet >/dev/null
TAG=$(git rev-parse --short HEAD)
VERSION=$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')
# every revision carries its commit in its name, so the list of revisions reads as the list of releases
SUFFIX="${TAG}-$(date +%m%d-%H%M%S)"
IMAGE="$REGION-docker.pkg.dev/$PROJECT/chefmealan/app:$TAG"
gcloud builds submit --project "$PROJECT" --config deploy/cloudbuild.yaml \
  --substitutions "_IMAGE=$IMAGE,_FB_API_KEY=$FB_API_KEY,_FB_AUTH_DOMAIN=$FB_AUTH_DOMAIN,_FB_PROJECT_ID=$FB_PROJECT_ID,_FB_APP_ID=$FB_APP_ID,_FB_DB_ID=$FB_DB_ID,_COMMIT=$TAG" .
# Photos as files (storage release 1): the bucket lets the app read photos back, and the server may remove them when an account is deleted
BUCKET="${STORAGE_BUCKET:-$FB_PROJECT_ID.firebasestorage.app}"
"$(pwd)/deploy/cors.sh" | grep -v "^Photos can be read" || true
PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member "serviceAccount:$PN-compute@developer.gserviceaccount.com" --role roles/storage.objectAdmin --quiet >/dev/null 2>&1 || echo "Photo storage: the server's access was not set"
# Delete my account: the server may switch off and remove a sign-in (Firebase Authentication), every deploy, so it never goes missing
gcloud projects add-iam-policy-binding "${FB_PROJECT_ID:-$PROJECT}" --member "serviceAccount:$PN-compute@developer.gserviceaccount.com" --role roles/firebaseauth.admin --condition=None --quiet >/dev/null 2>&1 || echo "Account delete: the server's right to remove sign-ins was not set (needs an owner of ${FB_PROJECT_ID:-$PROJECT})"
SECRETS="GEMINI_API_KEY=gemini-key:latest"
gcloud secrets describe airtable-key --project "$PROJECT" >/dev/null 2>&1 && SECRETS="$SECRETS,AIRTABLE_API_KEY=airtable-key:latest"
ENVS="AIRTABLE_BASE_ID=${AIRTABLE_BASE_ID:-},FIREBASE_PROJECT_ID=$FB_PROJECT_ID,FIRESTORE_DB_ID=$FB_DB_ID,FIREBASE_STORAGE_BUCKET=$BUCKET"
