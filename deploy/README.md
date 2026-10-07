# Chef Mealan in production

Runs on Cloud Run in `project-fb3c5fab-00d1-4d11-ac7`, region europe-west1, with our own Gemini key.
Data stays in Firestore, europe-west3 (Frankfurt). Address: chefmealan.com.

## Once
1. Gemini key: aistudio.google.com/apikey, "Create API key", pick project `project-fb3c5fab-00d1-4d11-ac7`.
2. Open Cloud Shell (shell.cloud.google.com), then:
   git clone https://github.com/mistancevic/PlateMate-Scanner.git && cd PlateMate-Scanner
   cp deploy/deploy.env.example deploy/deploy.env && nano deploy/deploy.env   # fill FB_API_KEY, FB_APP_ID, AIRTABLE_BASE_ID
   ./deploy/setup.sh
3. First release: ./deploy/deploy.sh   (prints the run.app address)
4. Firebase console, Authentication, Settings, Authorized domains: add chefmealan.com and www.chefmealan.com.
5. Domain: gcloud domains verify chefmealan.com  (a Search Console page opens; add its TXT record at Namecheap)
   then: gcloud beta run domain-mappings create --service chefmealan --domain chefmealan.com --region europe-west1
   gcloud beta run domain-mappings describe --domain chefmealan.com --region europe-west1   # lists the DNS records
6. Namecheap, Advanced DNS: delete the parking CNAME and the URL redirect; add the A and AAAA records shown for @,
   and CNAME www -> ghs.googlehosted.com. Keep Mail Settings on Email Forwarding. The certificate follows within an hour or so.

## Every release, the careful way (from 7 October 2026)
   cd ~/PlateMate-Scanner && git pull && ./deploy/preview.sh
Builds the new commit and puts it on its own preview link; chefmealan.com keeps serving the release before. The preview
uses the real accounts and data. The first time, it adds the preview's address to Firebase's sign-in list (or says how).
Check the preview on the phone, then:
   ./deploy/promote.sh
The preview is now what everyone gets, and the rules follow the code.

## One command back
   ./deploy/rollback.sh            back to the release before the last deploy or promote (run it again to undo)
   ./deploy/rollback.sh list       the last releases, newest first, with their commits
   ./deploy/rollback.sh <name>     back to that one
Rules are not rolled back: they only ever match the newer code or grow stricter.

## Straight to everyone
   cd ~/PlateMate-Scanner && git pull && ./deploy/deploy.sh
The old way, still there for a fix that can't wait: builds and puts it live at once, and remembers what served before,
so rollback works after it too. Rules are published by the same command (deploy/rules.sh), so they always match the code.
