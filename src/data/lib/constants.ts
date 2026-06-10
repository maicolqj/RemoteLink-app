import { Platform } from 'react-native';
import { PATH_SERVER, PATH_SERVER_LOCAL_ANDROID, PATH_SERVER_LOCAL_IOS, STAGE } from '@env';

const _base = (STAGE === 'production'
  ? PATH_SERVER
  : Platform.OS === 'android'
    ? PATH_SERVER_LOCAL_ANDROID
    : PATH_SERVER_LOCAL_IOS
).trim().replace(/\/graphql\/?$/, '');

export const API_URL      = `${_base}/graphql`;
export const REST_API_URL = _base;
export const APP_VERSION  = '1.0.0';

export const DEVICE_ID_KEY = 'remotelink_device_id';

