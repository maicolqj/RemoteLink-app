const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

const { withSentryConfig } = require('@sentry/react-native/metro');

// Sentry agrega debug ids al bundle para cruzarlo con sus source maps.
module.exports = withSentryConfig(mergeConfig(getDefaultConfig(__dirname), config));
