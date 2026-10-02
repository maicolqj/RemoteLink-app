import { gql } from '@apollo/client';

// Pública: se consulta al abrir la app, también sin sesión. Una versión vieja
// tiene que enterarse de que debe actualizar aunque ya no pueda entrar.
export const APP_VERSION_CHECK = gql`
  query AppVersionCheck($app: ClientApp!, $platform: ClientPlatform!, $versionCode: Int!) {
    appVersionCheck(app: $app, platform: $platform, versionCode: $versionCode) {
      updateRequired
      minVersionCode
      message
    }
  }
`;
