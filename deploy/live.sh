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
remember_live() { local r; r=$(live_revision); [ -n "$r" ] && echo "$r" > "$(dirname "${BASH_SOURCE[0]}")/.last-live"; true; }
