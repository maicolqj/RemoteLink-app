import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  I18nManager,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
  ViewStyle,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { ColorsApp, GlobalColors } from '../../constants/CustomColors';
import CustomTextComponent from '../../components/CustomTextComponent';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

type AlertType   = 'success' | 'error' | 'warning' | 'info' | 'question';
type SlideFrom   = 'left' | 'right' | 'top' | 'bottom';
type SlideAxis   = 'X' | 'Y';
type AnimType    = 'slide' | 'fade' | 'zoom';
type BtnStyle    = 'primary' | 'secondary' | 'text' | 'danger';
type IconLibrary = 'Ionicons' | 'MaterialIcons';
type AlertPos    = 'top' | 'center' | 'bottom';

interface IconPreset {
  name: string;
  library: IconLibrary;
  colorKey: keyof GlobalColors;
}

const ALERT_ICONS: Record<AlertType, IconPreset> = {
  success:  { name: 'thumb-up',     library: 'MaterialIcons', colorKey: 'success' },
  error:    { name: 'error',        library: 'MaterialIcons', colorKey: 'danger'  },
  warning:  { name: 'warning',      library: 'MaterialIcons', colorKey: 'warning' },
  info:     { name: 'info',         library: 'MaterialIcons', colorKey: 'info'    },
  question: { name: 'help',         library: 'MaterialIcons', colorKey: 'primary' },
};

// ============================================
// PUBLIC INTERFACES
// ============================================

export interface AlertButton {
  text: string;
  onPress: () => void;
  /** Default: true */
  closeOnPress?: boolean;
  style?: BtnStyle;
  icon?: string;
  iconLibrary?: IconLibrary;
  loading?: boolean;
}

export interface AlertOptions {
  /** Predefined type — sets icon, color, and title defaults. */
  type?: AlertType;
  /** Override icon name (requires iconLibrary too). */
  iconName?: string;
  iconLibrary?: IconLibrary;
  title?: string;
  description: string;
  /**
   * Key from GlobalColors palette (e.g. `'success'`).
   * Ignored when `colorRaw` is provided.
   */
  colorKey?: keyof GlobalColors;
  /**
   * Raw color string (hex / rgba). Takes precedence over colorKey and type defaults.
   */
  colorRaw?: string;
  /** Auto-dismiss duration in ms. 0 = never. Default: 4000. */
  duration?: number;
  position?: AlertPos;
  /** Override slide direction (defaults auto-detected from position). */
  slideFrom?: SlideFrom;
  /** Called after the alert fully hides. */
  onComplete?: () => void;
  /** When provided, disables auto-dismiss. */
  buttons?: AlertButton[];
  /** Allow swipe-to-dismiss and backdrop tap. Default: true. */
  dismissable?: boolean;
  /** Show progress bar during auto-dismiss. Default: true. */
  showProgress?: boolean;
  animationType?: AnimType;
  /** Opacity of the background dimmer. Default: 0.5. */
  backdropOpacity?: number;
  /** Trigger device vibration on show. Default: true. */
  haptic?: boolean;
}

export interface AlertContextType {
  showAlert:    (options: AlertOptions) => void;
  hideAlert:    () => void;
  showSuccess:  (description: string, title?: string, options?: Partial<AlertOptions>) => void;
  showError:    (description: string, title?: string, options?: Partial<AlertOptions>) => void;
  showWarning:  (description: string, title?: string, options?: Partial<AlertOptions>) => void;
  showInfo:     (description: string, title?: string, options?: Partial<AlertOptions>) => void;
  showQuestion: (description: string, title?: string, options?: Partial<AlertOptions>) => void;
}

// ============================================
// INTERNAL RESOLVED TYPE
// ============================================

type ResolvedOptions = Omit<Required<AlertOptions>, 'type' | 'slideFrom'> & {
  type: AlertType | undefined;
  slideFrom: SlideFrom | undefined;
};

const DEFAULT_OPTIONS: ResolvedOptions = {
  type:            undefined,
  iconName:        '',
  iconLibrary:     'MaterialIcons',
  title:           '',
  description:     '',
  colorKey:        'info',
  colorRaw:        '',
  duration:        4000,
  position:        'bottom',
  slideFrom:       undefined,
  onComplete:      () => {},
  buttons:         [],
  dismissable:     true,
  showProgress:    true,
  animationType:   'slide',
  backdropOpacity: 0.5,
  haptic:          true,
};

// ============================================
// CONTEXT
// ============================================

const AlertContext = createContext<AlertContextType | null>(null);

export const useAlert = (): AlertContextType => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used inside AlertProvider');
  return ctx;
};

// ============================================
// PURE HELPERS (outside component — zero deps)
// ============================================

function resolveSlideFrom(position: AlertPos, override?: SlideFrom): SlideFrom {
  if (override) return override;
  switch (position) {
    case 'top':    return 'top';
    case 'bottom': return 'bottom';
    case 'center': return 'right';
  }
}

function slideInitialValue(from: SlideFrom): number {
  switch (from) {
    case 'right':  return  SCREEN_W;
    case 'left':   return -SCREEN_W;
    case 'bottom': return  SCREEN_H;
    case 'top':    return -SCREEN_H;
  }
}

function slideAxis(from: SlideFrom): SlideAxis {
  return from === 'top' || from === 'bottom' ? 'Y' : 'X';
}

function resolveColor(opts: ResolvedOptions): string {
  if (opts.colorRaw) return opts.colorRaw;

  const key: keyof GlobalColors = opts.type
    ? ALERT_ICONS[opts.type].colorKey
    : opts.colorKey;

  // colorKey overrides type default when explicitly set (not the default 'info')
  const effectiveKey: keyof GlobalColors =
    opts.colorKey !== DEFAULT_OPTIONS.colorKey
      ? opts.colorKey
      : key;

  return ColorsApp[effectiveKey]?.() ?? ColorsApp.info();
}

function resolveIcon(opts: ResolvedOptions): { name: string; library: IconLibrary } {
  const preset = opts.type ? ALERT_ICONS[opts.type] : undefined;
  return {
    name:    opts.iconName    || preset?.name    || 'information-circle',
    library: opts.iconLibrary || preset?.library || 'Ionicons',
  };
}

function doHaptic(): void {
  if (Platform.OS === 'web') return;
  Vibration.vibrate(Platform.OS === 'ios' ? 10 : 50);
}

// ============================================
// PROVIDER
// ============================================

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [options,   setOptions]   = useState<ResolvedOptions>(DEFAULT_OPTIONS);

  // --- Animated values (stable object references, never reassigned) ---
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim    = useRef(new Animated.Value(0.85)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim    = useRef(new Animated.Value(0)).current;

  // --- Mutable refs (avoid stale closures in timers / PanResponder) ---
  const optionsRef      = useRef<ResolvedOptions>(DEFAULT_OPTIONS);
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef     = useRef<Animated.CompositeAnimation | null>(null);
  const slideAxisRef    = useRef<SlideAxis>('X');
  const hideAlertRef    = useRef<() => void>(() => {});

  // ==========================================
  // INTERNAL UTILITIES
  // ==========================================

  const applyOptions = useCallback((resolved: ResolvedOptions) => {
    optionsRef.current = resolved;
    setOptions(resolved);
  }, []);

  const stopTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressRef.current) {
      progressRef.current.stop();
      progressRef.current = null;
    }
  }, []);

  const resetAnimatedValues = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(0);
    scaleAnim.setValue(0.85);
    backdropAnim.setValue(0);
    progressAnim.setValue(0);
    swipeAnim.setValue(0);
  }, [backdropAnim, fadeAnim, progressAnim, scaleAnim, slideAnim, swipeAnim]);

  // ==========================================
  // HIDE ALERT
  // ==========================================

  const hideAlertInternal = useCallback((fromSwipe: boolean) => {
    stopTimers();

    const outAnims: Animated.CompositeAnimation[] = [
      Animated.timing(backdropAnim, {
        toValue:  0,
        duration: 250,
        easing:   Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue:  0,
        duration: 250,
        easing:   Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ];

    if (!fromSwipe && optionsRef.current.animationType === 'zoom') {
      outAnims.push(
        Animated.timing(scaleAnim, {
          toValue:  0.85,
          duration: 200,
          easing:   Easing.in(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      );
    }

    Animated.parallel(outAnims).start(() => {
      const onComplete = optionsRef.current.onComplete;
      resetAnimatedValues();
      applyOptions(DEFAULT_OPTIONS);
      setIsVisible(false);
      onComplete();
    });
  }, [stopTimers, backdropAnim, fadeAnim, scaleAnim, resetAnimatedValues, applyOptions]);

  const hideAlert = useCallback(() => {
    hideAlertInternal(false);
  }, [hideAlertInternal]);

  // Keep ref current so PanResponder / timer always call the latest version
  hideAlertRef.current = hideAlert;

  // ==========================================
  // PAN RESPONDER  (stable — uses only refs)
  // ==========================================

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: ()      => optionsRef.current.dismissable,
    onMoveShouldSetPanResponder:  (_, g)  => Math.abs(g.dx) > 5,

    onPanResponderGrant: () => {
      swipeAnim.setValue(0);
    },
    onPanResponderMove: (_, g) => {
      const dir = I18nManager.isRTL ? -1 : 1;
      swipeAnim.setValue(g.dx * dir);
    },
    onPanResponderRelease: (_, g) => {
      const threshold = SCREEN_W * 0.25;
      const dir = I18nManager.isRTL ? -1 : 1;

      if (Math.abs(g.dx) > threshold) {
        Animated.timing(swipeAnim, {
          toValue:  (g.dx > 0 ? SCREEN_W : -SCREEN_W) * dir,
          duration: 200,
          easing:   Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => hideAlertRef.current());
      } else {
        Animated.spring(swipeAnim, {
          toValue: 0,
          friction: 8,
          tension:  40,
          useNativeDriver: true,
        }).start();
      }
    },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================
  // SHOW ALERT
  // ==========================================

  const showAlert = useCallback((incoming: AlertOptions) => {
    stopTimers();
    resetAnimatedValues();

    const merged: ResolvedOptions = { ...DEFAULT_OPTIONS, ...incoming };
    applyOptions(merged);
    setIsVisible(true);

    if (merged.haptic) doHaptic();

    // Backdrop fade-in
    Animated.timing(backdropAnim, {
      toValue:  merged.backdropOpacity,
      duration: 300,
      easing:   Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Prepare slide transform
    if (merged.animationType === 'slide') {
      const from = resolveSlideFrom(merged.position, merged.slideFrom);
      slideAxisRef.current = slideAxis(from);
      slideAnim.setValue(slideInitialValue(from));
    }

    // Enter animations
    const enterAnims: Animated.CompositeAnimation[] = [
      Animated.spring(fadeAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ];

    if (merged.animationType === 'slide') {
      enterAnims.push(
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 40, useNativeDriver: true }),
      );
    } else {
      enterAnims.push(
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      );
    }

    Animated.parallel(enterAnims).start();

    // Auto-dismiss (only when no buttons)
    if (!merged.buttons?.length && merged.duration > 0) {
      progressRef.current = Animated.timing(progressAnim, {
        toValue:  1,
        duration: merged.duration,
        easing:   Easing.linear,
        useNativeDriver: false, // required for width-based interpolation
      });
      progressRef.current.start();

      timerRef.current = setTimeout(() => {
        hideAlertRef.current();
      }, merged.duration);
    }
  }, [
    stopTimers,
    resetAnimatedValues,
    applyOptions,
    backdropAnim,
    fadeAnim,
    slideAnim,
    scaleAnim,
    progressAnim,
  ]);

  // ==========================================
  // CONVENIENCE METHODS
  // ==========================================

  const showSuccess = useCallback((desc: string, title = '¡Éxito!', opts?: Partial<AlertOptions>) => {
    showAlert({ type: 'success', title, description: desc, ...opts });
  }, [showAlert]);

  const showError = useCallback((desc: string, title = 'Error', opts?: Partial<AlertOptions>) => {
    showAlert({ type: 'error', title, description: desc, ...opts });
  }, [showAlert]);

  const showWarning = useCallback((desc: string, title = 'Advertencia', opts?: Partial<AlertOptions>) => {
    showAlert({ type: 'warning', title, description: desc, ...opts });
  }, [showAlert]);

  const showInfo = useCallback((desc: string, title = 'Información', opts?: Partial<AlertOptions>) => {
    showAlert({ type: 'info', title, description: desc, ...opts });
  }, [showAlert]);

  const showQuestion = useCallback((desc: string, title = 'Confirmación', opts?: Partial<AlertOptions>) => {
    showAlert({ type: 'question', title, description: desc, ...opts });
  }, [showAlert]);

  // ==========================================
  // ALERT NODE  (memoized — skips reconciliation when alert is hidden)
  // ==========================================

  const alertNode = useMemo(() => {
    if (!isVisible) return null;

    const { title, description, position, buttons, showProgress, dismissable, animationType } = options;

    const { name: iconName, library: iconLibrary } = resolveIcon(options);
    const finalColor   = resolveColor(options);
    const IconComponent = iconLibrary === 'Ionicons' ? Icon : MaterialIcon;

    // Position style
    const positionStyle: ViewStyle = position === 'center'
      ? { top: SCREEN_H * 0.45, marginTop: -(SCREEN_H * 0.1) }
      : position === 'top'
      ? { top:    SCREEN_H * 0.05 }
      : { bottom: SCREEN_H * 0.05 };

    // Transform list
    const baseTransform =
      animationType === 'fade' || animationType === 'zoom'
        ? { scale: scaleAnim }
        : slideAxisRef.current === 'Y'
        ? { translateY: slideAnim }
        : { translateX: slideAnim };

    const transforms = [
      baseTransform,
      { translateX: swipeAnim },
    ] as Animated.WithAnimatedValue<ViewStyle>['transform'];

    const hasButtons = !!buttons?.length;

    return (
      <Modal
        transparent
        visible={isVisible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={dismissable ? hideAlert : undefined}
      >
        {/* Backdrop dimmer */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              backgroundColor: 'rgba(0,0,0,1)',
              opacity: backdropAnim,
            },
          ]}
          pointerEvents={dismissable && hasButtons ? 'auto' : 'none'}
        >
          {dismissable && (
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={hideAlert}
              activeOpacity={1}
            />
          )}
        </Animated.View>

        {/* Alert card */}
        <Animated.View
          style={[
            styles.container,
            positionStyle,
            { opacity: fadeAnim, transform: transforms },
          ]}
          {...(dismissable ? panResponder.panHandlers : {})}
        >
          <View style={[styles.gradientContainer, { backgroundColor: finalColor }]}>
            {/* Auto-dismiss progress bar */}
            {showProgress && !hasButtons && (
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange:  [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: `${finalColor}80`,
                  },
                ]}
              />
            )}

            {/* Main row */}
            <View style={[styles.content, hasButtons && styles.contentWithButtons]}>
              <IconComponent
                name={iconName}
                size={SCREEN_H * 0.03}
                color={ColorsApp.white()}
                style={styles.icon}
              />
              <View style={styles.textContent}>
                {!!title && (
                  <CustomTextComponent style={styles.title}>
                    {title}
                  </CustomTextComponent>
                )}
                <CustomTextComponent style={styles.description}>
                  {description}
                </CustomTextComponent>
              </View>
              {dismissable && !hasButtons && (
                <TouchableOpacity onPress={hideAlert} style={styles.closeButton} hitSlop={HIT_SLOP}>
                  <Icon name="close" size={SCREEN_H * 0.025} color={ColorsApp.white()} />
                </TouchableOpacity>
              )}
            </View>

            {/* Action buttons */}
            {hasButtons && (
              <View style={styles.buttonsContainer}>
                {buttons!.map((btn, i) => {
                  const BtnIcon = btn.iconLibrary === 'MaterialIcons' ? MaterialIcon : Icon;
                  return (
                    <TouchableOpacity
                      key={`alert-btn-${i}`}
                      onPress={() => {
                        btn.onPress();
                        if (btn.closeOnPress !== false) hideAlert();
                      }}
                      style={[
                        styles.button,
                        btn.style === 'secondary' && styles.secondaryButton,
                        btn.style === 'text'      && styles.textButton,
                      ]}
                      disabled={btn.loading}
                      activeOpacity={0.7}
                    >
                      {btn.loading ? (
                        <Icon
                          name="hourglass"
                          size={SCREEN_H * 0.02}
                          color={ColorsApp.white()}
                          style={styles.buttonIcon}
                        />
                      ) : btn.icon ? (
                        <BtnIcon
                          name={btn.icon}
                          size={SCREEN_H * 0.02}
                          color={ColorsApp.white()}
                          style={styles.buttonIcon}
                        />
                      ) : null}
                      <CustomTextComponent
                        style={[
                          styles.buttonText,
                          btn.style === 'secondary' && styles.secondaryButtonText,
                          btn.style === 'text'      && styles.textButtonText,
                        ]}
                      >
                        {btn.text}
                      </CustomTextComponent>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>
      </Modal>
    );
  }, [
    isVisible,
    options,
    fadeAnim,
    slideAnim,
    scaleAnim,
    backdropAnim,
    progressAnim,
    swipeAnim,
    panResponder,
    hideAlert,
  ]);

  // ==========================================
  // CONTEXT VALUE  (stable while callbacks don't change)
  // ==========================================

  const contextValue = useMemo<AlertContextType>(
    () => ({
      showAlert,
      hideAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showQuestion,
    }),
    [showAlert, hideAlert, showSuccess, showError, showWarning, showInfo, showQuestion],
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {alertNode}
    </AlertContext.Provider>
  );
};

// ============================================
// CONSTANTS
// ============================================

const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  container: {
    position:     'absolute',
    width:        SCREEN_W * 0.9,
    left:         SCREEN_W * 0.05,
    borderRadius: SCREEN_W * 0.03,
    overflow:     'hidden',
    elevation:    10,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius:  6,
    zIndex: 9999,
  },
  gradientContainer: {
    padding: SCREEN_W * 0.04,
  },
  progressBar: {
    height:       3,
    position:     'absolute',
    top:          0,
    left:         0,
    borderRadius: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  contentWithButtons: {
    marginBottom: SCREEN_H * 0.01,
  },
  icon: {
    marginRight: SCREEN_W * 0.03,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize:     SCREEN_H * 0.022,
    fontFamily:   'textBold',
    color:        ColorsApp.white(),
    marginBottom: SCREEN_H * 0.005,
  },
  description: {
    fontSize:   SCREEN_H * 0.018,
    fontFamily: 'textRegular',
    color:      ColorsApp.white(0.9),
    lineHeight: SCREEN_H * 0.022,
  },
  closeButton: {
    padding:    SCREEN_W * 0.01,
    marginLeft: SCREEN_W * 0.02,
  },
  buttonsContainer: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    gap:            SCREEN_W * 0.02,
    marginTop:      SCREEN_H * 0.015,
  },
  button: {
    paddingVertical:   SCREEN_H * 0.01,
    paddingHorizontal: SCREEN_W * 0.04,
    borderRadius:      SCREEN_W * 0.06,
    backgroundColor:   ColorsApp.white(0.2),
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SCREEN_W * 0.02,
  },
  buttonIcon: {
    marginRight: SCREEN_W * 0.01,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth:     1,
    borderColor:     ColorsApp.white(0.3),
  },
  textButton: {
    backgroundColor:   'transparent',
    paddingHorizontal: SCREEN_W * 0.02,
  },
  buttonText: {
    color:      ColorsApp.white(),
    fontSize:   SCREEN_H * 0.018,
    fontFamily: 'textMedium',
  },
  secondaryButtonText: {
    color: ColorsApp.white(0.9),
  },
  textButtonText: {
    color:           ColorsApp.white(0.8),
    textDecorationLine: 'underline',
  },
});
