#!/usr/bin/env bash
# Step 2 of a careful release: the preview becomes what everyone gets on chefmealan.com, and the rules follow the code.
# What served before is remembered, so ./deploy/rollback.sh brings it back with one command.
set -euo pipefail
cd "$(dirname "$0")"; source ./deploy.env; cd ..
source deploy/live.sh
gcloud config set project "$PROJECT" --quiet >/dev/null
REV=$(tag_revision preview)
if [ -z "$REV" ]; then echo "No preview to promote. Run ./deploy/preview.sh first."; exit 1; fi
NOW=$(live_revision)
if [ "$REV" = "$NOW" ]; then echo "The preview is already live ($(commit_of "$REV"))."; exit 0; fi
remember_live
gcloud run services update-traffic "$SERVICE" --project "$PROJECT" --region "$REGION" --to-revisions "$REV=100" --quiet >/dev/null
echo "Live: $(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')  ($(commit_of "$REV"))"
echo "Before it: $(commit_of "$NOW"). To go back: ./deploy/rollback.sh"
"$(dirname "$0")/rules.sh" || echo "Rules not published: check the message above, or paste firestore.rules in the Firebase console."
