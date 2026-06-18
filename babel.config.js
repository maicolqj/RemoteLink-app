const isAab      = process.env.BUILD_DIST === 'aab';
const isProdBuild = process.env.BUILD_ENV  === 'production' || isAab;

const envPath = isAab ? '.env.aab' : isProdBuild ? '.env.production' : '.env.development';

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: envPath,
      envName: 'APP_ENV',
    }],

    // 'react-native-worklets/plugin',

    // Strip console.* only in true production builds
    ...(isProdBuild ? ['transform-remove-console'] : []),
  ]
};
