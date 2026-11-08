# Sign in with any email: your steps in Firebase (DT259, 0.3.113)

Coach Milan, 8 November 2026. Board Stories194. The app is ready; these switches are yours, in the Firebase console of the live project. Until step 1 is done, Send me a link shows an error and Google sign in works as before.

## 1. Turn on the email link (2 minutes)

Authentication, Sign-in method, Email/Password. Turn on **Email link (passwordless sign-in)**. Leave "Email/Password" itself as you like; the app never asks for a password. Save.

## 2. The app's addresses may receive the link

Authentication, Settings, **Authorized domains**. chefmealan.com must be listed, and the Preview address if you test there. Google sign in already needs them, so they are most likely there.

## 3. Nobody can test which emails have an account

Authentication, Settings, User actions. **Email enumeration protection**: on.

## 4. One account per email

Authentication, Settings, **User account linking**: "Link accounts that use the same email". A Hotmail used with Google and with a link stays one account.

## 5. The email comes from chefmealan.com (less spam)

Authentication, **Templates**, Email address sign-in (or any template), the pencil, **Customize domain**. Type chefmealan.com. Firebase shows a few DNS records (a TXT record, and CNAME records for sending). Add them where chefmealan.com's DNS is kept, then press Verify. It can take up to 48 hours.

The sender name can be Chef Mealan; the reply-to hello@chefmealan.com.

## 6. The email's language

Nothing to do. The app tells Firebase the phone's language (en, sr, de), and Firebase writes its own sign-in email in it.

## Check it

On your phone, signed out: Sign in, your email, Send me a link. The email comes; the link opens Chef Mealan and you are in. Then Menu, Account, Delete my account shows the new screen (do not finish it on your own account).
