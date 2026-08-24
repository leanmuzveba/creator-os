/// Static OAuth developer-portal configuration values shown in the connection
/// setup guides (redirect URIs, app domains, and scopes for each platform).
/// Mirrors `src/components/accounts/oauthConfig.ts`. These are display/reference
/// strings copied into the various developer consoles; not secrets.
library;

const String kTiktokDevCallbackUrl =
    'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/tiktok/callback';
const String kTiktokSharedCallbackUrl =
    'https://ais-pre-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/tiktok/callback';
const String kTiktokScopes = 'user.info.basic';

const String kMetaIgDevCallbackUrl =
    'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/instagram/callback';
const String kMetaFbDevCallbackUrl =
    'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/facebook/callback';
const String kAppDomain = 'ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app';
const String kSiteUrl = 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app';
const String kPrivacyPolicyUrl = 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/privacy';
const String kTermsUrl = 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/terms';
const String kMetaScopes = 'public_profile';

const String kYtDevCallbackUrl =
    'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/youtube/callback';
const String kYtSharedCallbackUrl =
    'https://ais-pre-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/youtube/callback';
const String kYtScopes =
    'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile';
