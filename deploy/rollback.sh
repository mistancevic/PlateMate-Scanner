#!/usr/bin/env bash
# One command back: chefmealan.com serves the release that was live before the last deploy or promote.
# ./deploy/rollback.sh                 back to the one before
# ./deploy/rollback.sh list            the last releases, newest first
# ./deploy/rollback.sh <revision>      back to that one, from the list
# Rules are not rolled back: a rollback is for the app; rules only ever grow stricter or match newer code.
set -euo pipefail
cd "$(dirname "$0")"; source ./deploy.env; cd ..
source deploy/live.sh
gcloud config set project "$PROJECT" --quiet >/dev/null
if [ "${1:-}" = "list" ]; then
  NOW=$(live_revision)
  gcloud run revisions list --service "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(metadata.name,metadata.creationTimestamp)' --limit 8 \
    | while read -r name at; do echo "$name  ${at%%.*}  $(commit_of "$name")$([ "$name" = "$NOW" ] && echo "  ← live now")"; done
  exit 0
fi
TARGET="${1:-}"
[ -z "$TARGET" ] && [ -f deploy/.last-live ] && TARGET=$(cat deploy/.last-live)
if [ -z "$TARGET" ]; then echo "Nothing remembered to go back to. Pick one from: ./deploy/rollback.sh list"; exit 1; fi
NOW=$(live_revision)
if [ "$TARGET" = "$NOW" ]; then echo "That release is already live ($(commit_of "$NOW"))."; exit 0; fi
gcloud run services update-traffic "$SERVICE" --project "$PROJECT" --region "$REGION" --to-revisions "$TARGET=100" --quiet >/dev/null
echo "$NOW" > deploy/.last-live
echo "Live again: $(commit_of "$TARGET") ($TARGET). Before the rollback: $(commit_of "$NOW"); ./deploy/rollback.sh brings it back."
