#!/usr/bin/env bash
# One time: turn on the services, make a place for images, store the two secrets.
set -euo pipefail
cd "$(dirname "$0")"; source ./deploy.env
gcloud config set project "$PROJECT"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com generativelanguage.googleapis.com
gcloud artifacts repositories describe chefmealan --location "$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create chefmealan --repository-format docker --location "$REGION"
read -rsp "Paste the Gemini API key (from aistudio.google.com/apikey, project $PROJECT): " GK; echo
printf %s "$GK" | (gcloud secrets create gemini-key --data-file=- 2>/dev/null || gcloud secrets versions add gemini-key --data-file=-)
read -rsp "Paste the Airtable API key (Enter to skip): " AK; echo
if [ -n "$AK" ]; then printf %s "$AK" | (gcloud secrets create airtable-key --data-file=- 2>/dev/null || gcloud secrets versions add airtable-key --data-file=-); fi
PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
for s in gemini-key airtable-key; do
  gcloud secrets describe "$s" >/dev/null 2>&1 && gcloud secrets add-iam-policy-binding "$s" --member "serviceAccount:$PN-compute@developer.gserviceaccount.com" --role roles/secretmanager.secretAccessor >/dev/null
done
echo "Setup done. Next: ./deploy.sh"
