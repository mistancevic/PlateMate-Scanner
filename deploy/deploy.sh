#!/usr/bin/env bash
# A release straight to everyone: build the image from the current commit and put it live at once.
# The careful way: ./deploy/preview.sh, check the preview link, then ./deploy/promote.sh. Undo with ./deploy/rollback.sh.
set -euo pipefail
cd "$(dirname "$0")"; source ./deploy.env; cd ..
source deploy/build.sh
source deploy/live.sh
# what serves now, so ./deploy/rollback.sh can bring it back
remember_live
gcloud run deploy "$SERVICE" --project "$PROJECT" --region "$REGION" --image "$IMAGE" \
  --allow-unauthenticated --memory 512Mi --max-instances 3 --revision-suffix "$SUFFIX" \
  --set-secrets "$SECRETS" --set-env-vars "$ENVS"
# straight to everyone: after a promote or a rollback the traffic is pinned to one revision, so move it to the new one
gcloud run services update-traffic "$SERVICE" --project "$PROJECT" --region "$REGION" --to-latest --quiet >/dev/null
echo "Live: $(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')  (commit $TAG, version $VERSION)"
"$(dirname "$0")/rules.sh" || echo "Rules not published: check the message above, or paste firestore.rules in the Firebase console."
