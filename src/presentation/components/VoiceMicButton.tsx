import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ColorsApp } from '../constants/CustomColors';

const {width: wp, height: hp } = Dimensions.get('screen');
interface Props {
  isListening: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
}

export default function VoiceMicButton({
  isListening,
  onPress,
  size = wp * 0.15,
  color = '#55C2DA',
}: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.35, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isListening, pulse]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={st.wrap} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      {isListening && (
        <Animated.View
          style={[
            st.ripple,
            { width: size * 2.4, height: size * 2.4, borderRadius: size * 1.2, borderColor: color, transform: [{ scale: pulse }] },
          ]}
        />
      )}
      <View style={[st.circle, { width: size * 2.30, height: size * 2.3, borderRadius: (wp * 0.05) / 2, backgroundColor: isListening ? color : `${color}22`, borderColor: color }]}>
        <Icon name={isListening ? 'mic' : 'mic-none'} size={size} color={isListening ? ColorsApp.danger() : ColorsApp.white()} />
      </View>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  wrap:   { alignItems: 'center', justifyContent: 'center', width: wp * 0.15, },
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  ripple: { position: 'absolute', borderWidth: 1.5, opacity: 0.35 },
});
