// Bloom app config — wraps app.json and adds native sign-in wiring.
//
// Apple: always on (the entitlement is required for App Review whenever
// social sign-in is offered). Activates once the Apple provider is enabled
// in the Supabase dashboard.
//
// Google: dormant until the dashboard keys exist. To light it up, add to
// app.json → expo.extra:
//   "googleWebClientId": "…apps.googleusercontent.com"   (OAuth "Web" client)
//   "googleIosClientId": "…apps.googleusercontent.com"   (OAuth "iOS" client)
//   "googleIosUrlScheme": "com.googleusercontent.apps.…" (reversed iOS client ID)
// and drop GoogleService-Info.plist at the repo root, then set
// ios.googleServicesFile in app.json. Next EAS build picks it all up.
const base = require('./app.json');

const extra = base.expo.extra ?? {};

const plugins = [...base.expo.plugins, 'expo-apple-authentication'];
if (extra.googleIosUrlScheme) {
  plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: extra.googleIosUrlScheme }]);
}

module.exports = {
  expo: {
    ...base.expo,
    ios: {
      ...base.expo.ios,
      usesAppleSignIn: true,
      ...(extra.googleIosUrlScheme ? { googleServicesFile: './GoogleService-Info.plist' } : {}),
    },
    plugins,
  },
};
