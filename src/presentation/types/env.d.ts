declare module '@env' {
    export const NAMEAPP: string;
    export const STAGE: string;
    export const DISTRIBUTION: 'dev' | 'apk' | 'aab';
    export const PATH_SERVER: string;
    export const PATH_SERVER_LOCAL_ANDROID: string;
    export const PATH_SERVER_LOCAL_IOS: string;
}