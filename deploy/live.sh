#!/usr/bin/env bash
# Shared helpers (sourced): which revision serves the app now, and the commit in a revision's name.
# A revision is named chefmealan-<commit>-<date>; older ones, from before 7 October 2026, are chefmealan-000NN-xyz.
live_revision() {
  gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format=json \
    | python3 -c 'import sys,json; t=json.load(sys.stdin)["status"].get("traffic",[]); print(next((x["revisionName"] for x in t if x.get("percent",0)==100), ""))'
}
tag_revision() { # the revision behind a tag, e.g. preview
  gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format=json \
    | python3 -c 'import sys,json; t=json.load(sys.stdin)["status"].get("traffic",[]); print(next((x["revisionName"] for x in t if x.get("tag")==sys.argv[1]), ""))' "$1"
}
commit_of() { local r="${1#"$SERVICE"-}"; if [[ "$r" =~ ^[0-9]{5}-[a-z0-9]{3}$ ]]; then echo "a release from before 7 October"; else echo "commit ${r%%-*}"; fi; }
# What was live before the last promote or rollback (3 November 2026): kept in Google Cloud, in the build bucket, so a promote from
# GitHub and a rollback from Cloud Shell (or the other way round) agree; the file in deploy/ stays as a copy for Cloud Shell
LAST_LIVE_OBJ() { echo "gs://${PROJECT}_cloudbuild/deploy/last-live"; }
set_last_live() { [ -n "$1" ] || return 0; echo "$1" > "$(dirname "${BASH_SOURCE[0]}")/.last-live"; echo "$1" | gcloud storage cp - "$(LAST_LIVE_OBJ)" --quiet >/dev/null 2>&1 || echo "Note: what was live before is kept on this machine only."; }
get_last_live() { gcloud storage cat "$(LAST_LIVE_OBJ)" 2>/dev/null | head -1 || true; }
remember_live() { local r; r=$(live_revision); set_last_live "$r"; true; }
