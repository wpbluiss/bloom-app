// Bloom app config — wraps app.json and adds the Apple sign-in entitlement.
//
// Apple: always on (the entitlement is required for App Review whenever
// social sign-in is offered). Activates once the Apple provider is enabled
// in the Supabase dashboard.
//
// Google sign-in was removed from the native build (it crashed startup while
// unconfigured). To bring it back one day: reinstall
// @react-native-google-signin/google-signin, add its config plugin here with
// the reversed iOS client ID, and set the OAuth keys in app.json → extra.
const base = require('./app.json');

module.exports = {
  expo: {
    ...base.expo,
    ios: {
      ...base.expo.ios,
      usesAppleSignIn: true,
    },
    plugins: [...base.expo.plugins, 'expo-apple-authentication'],
  },
};
