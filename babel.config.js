const buildEnv = process.env.BUILD_ENV; // set by our build:* scripts: 'staging' | 'production'
const isAab    = process.env.BUILD_DIST === 'aab';

// BUILD_ENV (from our scripts) is authoritative. Gradle forces BABEL_ENV=production
// for every release-type bundle, so it can't be trusted to distinguish staging vs prod.
const target = buildEnv
  || (isAab ? 'production' : null)
  || ((process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production') ? 'production' : 'development');

const isProd    = target === 'production';
const isStaging = target === 'staging';

const envPath = isProd    ? '.env.production'
              : isStaging ? '.env.staging'
              : '.env.development';

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: envPath,
      envName: 'APP_ENV',
    }],

    // 'react-native-worklets/plugin', // not installed — re-enable after adding the dep

    // Strip all console.* calls in production bundles
    ...(isProd ? ['transform-remove-console'] : []),
  ]
};
