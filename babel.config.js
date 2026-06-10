const nodeEnv = process.env.NODE_ENV || 'development';
const isProd  = nodeEnv === 'production' || process.env.BABEL_ENV === 'production';
const isAab   = process.env.BUILD_DIST === 'aab';

const envPath = isAab ? '.env.aab' : isProd ? '.env.production' : '.env.development';

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: envPath,
      envName: 'APP_ENV',
    }],

    // 'react-native-worklets/plugin',

    // Strip all console.* calls in production bundles
    ...(isProd ? ['transform-remove-console'] : []),
  ]
};
