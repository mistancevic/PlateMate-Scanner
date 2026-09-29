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

## Every release
   cd PlateMate-Scanner && git pull && ./deploy/deploy.sh
Rules changed? Also: firebase deploy --only firestore:rules --project project-fb3c5fab-00d1-4d11-ac7
