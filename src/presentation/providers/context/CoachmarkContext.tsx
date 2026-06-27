import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import { useTheme } from './ThemeContext';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CoachStep {
  /** Id of the target registered via useCoachmarkTarget. */
  targetId: string;
  title: string;
  text: string;
  /** Highlight ring corner radius. Default: derived from target. */
  radius?: number;
  /** Force tooltip side. Default: auto (opposite to the target). */
  placement?: 'top' | 'bottom';
}

interface StartOptions {
  /** When set, the tour only runs once per device (persisted in AsyncStorage). */
  persistKey?: string;
  onFinish?: () => void;
}

interface CoachmarkContextType {
  startTour: (steps: CoachStep[], opts?: StartOptions) => void;
  stopTour: () => void;
  isActive: boolean;
  /** Clears the "seen" flag so the tour can run again (useful for dev / settings). */
  resetTour: (persistKey: string) => Promise<void>;
  /** @internal */
  _register: (id: string, ref: React.RefObject<any>) => void;
  /** @internal */
  _unregister: (id: string) => void;
}

const STORAGE_PREFIX = '@coachmark/';
const RING_PADDING = 8;
const TOOLTIP_GAP = 14;
const TOOLTIP_W = Math.min(SCREEN_W * 0.86, 360);
const ARROW = 10;

const CoachmarkContext = createContext<CoachmarkContextType | null>(null);

export function useCoachmark(): CoachmarkContextType {
  const ctx = useContext(CoachmarkContext);
  if (!ctx) throw new Error('useCoachmark must be used inside CoachmarkProvider');
  return ctx;
}

/**
 * Marks an element as a tour target. Spread the returned ref onto any host
 * component (View, TouchableOpacity, …). For plain Views that have no press
 * handler, also pass `collapsable={false}` so Android keeps them measurable.
 */
export function useCoachmarkTarget(id: string): React.RefObject<any> {
  const ref = useRef<any>(null);
  const ctx = useContext(CoachmarkContext);
  React.useEffect(() => {
    ctx?._register(id, ref);
    return () => ctx?._unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return ref;
}

// ============================================
// HELPERS
// ============================================

function measureNode(ref?: React.RefObject<any>): Promise<Rect | null> {
  return new Promise(resolve => {
    const node = ref?.current;
    if (!node || typeof node.measureInWindow !== 'function') return resolve(null);
    node.measureInWindow((x: number, y: number, width: number, height: number) => {
      if (!width && !height) return resolve(null);
      resolve({ x, y, width, height });
    });
  });
}

// Measure with a few retries — targets may still be laying out when the tour starts.
async function measureWithRetry(ref?: React.RefObject<any>, tries = 5): Promise<Rect | null> {
  for (let i = 0; i < tries; i++) {
    const rect = await measureNode(ref);
    if (rect) return rect;
    await new Promise<void>(r => requestAnimationFrame(() => r()));
  }
  return null;
}

// ============================================
// PROVIDER
// ============================================

export function CoachmarkProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  const registry = useRef<Map<string, React.RefObject<any>>>(new Map());

  const [steps, setSteps] = useState<CoachStep[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);

  const persistKeyRef = useRef<string | undefined>(undefined);
  const onFinishRef = useRef<(() => void) | undefined>(undefined);
  const fade = useRef(new Animated.Value(0)).current;

  const _register = useCallback((id: string, ref: React.RefObject<any>) => {
    registry.current.set(id, ref);
  }, []);
  const _unregister = useCallback((id: string) => {
    registry.current.delete(id);
  }, []);

  const goToStep = useCallback(async (stepList: CoachStep[], i: number) => {
    const step = stepList[i];
    if (!step) return false;
    const r = await measureWithRetry(registry.current.get(step.targetId));
    if (!r) return false;
    setRect(r);
    setIndex(i);
    return true;
  }, []);

  const finish = useCallback(() => {
    if (persistKeyRef.current) {
      AsyncStorage.setItem(STORAGE_PREFIX + persistKeyRef.current, '1').catch(() => {});
    }
    Animated.timing(fade, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setSteps([]);
      setRect(null);
      setIndex(0);
      const cb = onFinishRef.current;
      onFinishRef.current = undefined;
      cb?.();
    });
  }, [fade]);

  const startTour = useCallback(
    async (stepList: CoachStep[], opts?: StartOptions) => {
      if (visible || !stepList.length) return;
      if (opts?.persistKey) {
        const seen = await AsyncStorage.getItem(STORAGE_PREFIX + opts.persistKey);
        if (seen) return;
      }
      persistKeyRef.current = opts?.persistKey;
      onFinishRef.current = opts?.onFinish;

      // Find the first step whose target is actually measurable.
      let i = 0;
      let ok = false;
      while (i < stepList.length && !(ok = await goToStep(stepList, i))) i++;
      if (!ok) return; // nothing to show

      setSteps(stepList);
      setVisible(true);
      fade.setValue(0);
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    },
    [visible, goToStep, fade],
  );

  const next = useCallback(async () => {
    // Advance to the next step that can be measured; finish if none remain.
    let i = index + 1;
    while (i < steps.length) {
      if (await goToStep(steps, i)) return;
      i++;
    }
    finish();
  }, [index, steps, goToStep, finish]);

  const stopTour = useCallback(() => finish(), [finish]);

  // Android back button closes the tour while active.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      finish();
      return true;
    });
    return () => sub.remove();
  }, [visible, finish]);

  const resetTour = useCallback(async (persistKey: string) => {
    await AsyncStorage.removeItem(STORAGE_PREFIX + persistKey);
  }, []);

  const value = useMemo<CoachmarkContextType>(
    () => ({ startTour, stopTour, isActive: visible, resetTour, _register, _unregister }),
    [startTour, stopTour, visible, resetTour, _register, _unregister],
  );

  // ── Overlay geometry ──────────────────────────────────────────────────────
  const step = steps[index];
  const isLast = index >= steps.length - 1;

  let overlay: React.ReactNode = null;
  if (visible && rect && step) {
    const ringRadius = step.radius ?? RADIUS.md;
    const hx = rect.x - RING_PADDING;
    const hy = rect.y - RING_PADDING;
    const hw = rect.width + RING_PADDING * 2;
    const hh = rect.height + RING_PADDING * 2;

    // Place tooltip on the side with more room (or forced by step.placement).
    const spaceBelow = SCREEN_H - (hy + hh);
    const below = step.placement ? step.placement === 'bottom' : spaceBelow > SCREEN_H * 0.4;

    const cardLeft = Math.max(
      SPACING.md,
      Math.min(rect.x + rect.width / 2 - TOOLTIP_W / 2, SCREEN_W - TOOLTIP_W - SPACING.md),
    );
    const targetCenterX = rect.x + rect.width / 2;
    const arrowLeft = Math.max(
      ARROW,
      Math.min(targetCenterX - cardLeft - ARROW, TOOLTIP_W - ARROW * 3),
    );

    const dim = colors.overlay ?? 'rgba(0,0,0,0.6)';
    const cardPos = below ? { top: hy + hh + TOOLTIP_GAP } : { bottom: SCREEN_H - hy + TOOLTIP_GAP };

    overlay = (
      <Animated.View style={[styles.overlayRoot, { opacity: fade }]} pointerEvents="box-none">
        {/* Dimmed backdrop built from 4 rects, leaving the target cut out.
            Tapping the dim advances the tour. */}
        <TouchableWithoutFeedback onPress={next}>
          <View style={styles.fill}>
            <View style={[styles.dim, { backgroundColor: dim, top: 0, left: 0, right: 0, height: hy }]} />
            <View style={[styles.dim, { backgroundColor: dim, top: hy + hh, left: 0, right: 0, bottom: 0 }]} />
            <View style={[styles.dim, { backgroundColor: dim, top: hy, left: 0, width: hx, height: hh }]} />
            <View style={[styles.dim, { backgroundColor: dim, top: hy, left: hx + hw, right: 0, height: hh }]} />
          </View>
        </TouchableWithoutFeedback>

        {/* Highlight ring around the target */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: hx,
            top: hy,
            width: hw,
            height: hh,
            borderRadius: ringRadius,
            borderWidth: 2,
            borderColor: colors.primaryLight,
          }}
        />

        {/* Tooltip card */}
        <View style={[styles.card, { left: cardLeft, width: TOOLTIP_W, backgroundColor: colors.surface }, cardPos]}>
          {/* Arrow */}
          <View
            pointerEvents="none"
            style={[
              styles.arrow,
              { left: arrowLeft, backgroundColor: colors.surface },
              below ? { top: -ARROW / 2 } : { bottom: -ARROW / 2 },
            ]}
          />

          <View style={styles.cardHeader}>
            <CustomTextComponent fontSize={FONT_SIZE.lg} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary}>
              {step.title}
            </CustomTextComponent>
            <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
              {index + 1}/{steps.length}
            </CustomTextComponent>
          </View>

          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.cardText}>
            {step.text}
          </CustomTextComponent>

          <View style={styles.cardFooter}>
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === index ? colors.primary : colors.border },
                  ]}
                />
              ))}
            </View>

            <View style={styles.actions}>
              {!isLast && (
                <TouchableOpacity onPress={finish} hitSlop={HIT_SLOP} style={styles.skipBtn}>
                  <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
                    Saltar
                  </CustomTextComponent>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={next}
                activeOpacity={0.8}
                style={[styles.nextBtn, { backgroundColor: colors.primary }]}>
                <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textInverse}>
                  {isLast ? 'Entendido' : 'Siguiente'}
                </CustomTextComponent>
                {!isLast && <Icon name="arrow-forward" size={16} color={colors.textInverse} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <CoachmarkContext.Provider value={value}>
      {children}
      {/* In-tree overlay (not a Modal): shares the same coordinate space as
          measureInWindow, so the spotlight aligns with the targets. */}
      {visible && overlay}
    </CoachmarkContext.Provider>
  );
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const styles = StyleSheet.create({
  overlayRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dim: { position: 'absolute' },
  card: {
    position: 'absolute',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  arrow: {
    position: 'absolute',
    width: ARROW,
    height: ARROW,
    transform: [{ rotate: '45deg' }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  cardText: {
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  skipBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
  },
});
