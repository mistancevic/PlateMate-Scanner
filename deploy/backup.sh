#!/usr/bin/env bash
# DT173 (0.3.15, privacy finding 12, option a; Coach Milan 30 October 15:39): records outside the app. A daily backup of the whole
# database, kept by Google in the database's own location (Frankfurt), each copy kept 30 days and then deleted on its own. Run
# once; running it again only shows the schedule. The privacy notice, section 4, says so.
set -euo pipefail
cd "$(dirname "$0")"; source ./deploy.env; cd ..
DB="${FB_DB_ID:-(default)}"
NOW=$(gcloud firestore backups schedules list --project "$PROJECT" --database="$DB" --format="value(name,dailyRecurrence,retention)" 2>/dev/null || true)
if [ -n "$NOW" ]; then echo "The daily backup is already on:"; echo "$NOW"; exit 0; fi
gcloud firestore backups schedules create --project "$PROJECT" --database="$DB" --recurrence=daily --retention=30d
echo "Daily backup on for database $DB in project $PROJECT: one copy a day, each kept 30 days."
echo "See them: gcloud firestore backups list --project $PROJECT"
