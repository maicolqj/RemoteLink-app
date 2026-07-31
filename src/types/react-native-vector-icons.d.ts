// react-native-vector-icons@10 no publica tipos propios. Los tipos de la
// comunidad (@types/react-native-vector-icons) arrastran @types/react-native@0.70,
// incompatible con RN 0.85, así que declaramos aquí lo que el proyecto usa:
// únicamente el componente por set de iconos.
declare module 'react-native-vector-icons/*' {
  import type * as React from 'react';
  import type { StyleProp, TextStyle } from 'react-native';

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
    allowFontScaling?: boolean;
  }

  const Icon: React.ComponentType<IconProps>;
  export default Icon;
}
