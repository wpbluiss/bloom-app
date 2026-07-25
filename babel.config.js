module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 moved its Babel plugin to the react-native-worklets
    // package. The old 'react-native-reanimated/plugin' entry is removed in
    // v4 and silently breaks worklet-driven styles in release/production
    // bundles (animated components fail to paint their children).
    plugins: ['react-native-worklets/plugin'],
  };
};
