import { useEffect } from 'react';
import type { NavigationContainerRef, NavigationState } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types/NavigationTypes';
import { useAuthStore } from '../store/auth.store';
import { useAlert } from '../providers/context/AlertContext';
import { SCREEN_MODULE, moduleLabel } from '../constants/modules';

/**
 * Forma laxa del estado de navegación a propósito.
 *
 * Los tipos de React Navigation distinguen el estado completo del parcial —una
 * ruta anidada puede venir sin `key`—, y aquí se recorre indistintamente:
 * podar es copiar la misma forma que llegó, con menos rutas. Tiparlo estricto
 * obliga a castear en cada rama sin ganar nada.
 */
type AnyRoute = { name: string; state?: AnyState; [k: string]: unknown };
type AnyState = { routes: AnyRoute[]; index?: number; [k: string]: unknown };

/**
 * Saca al residente de las pantallas de un módulo que el conjunto acaba de
 * apagar.
 *
 * Esconder el acceso del inicio no alcanza: quien ya estaba adentro se queda
 * con una pantalla que el servidor va a rechazar con `COMPLEX_MODULE_DISABLED`
 * en la próxima consulta, y entendiendo que la app se rompió. La web hace lo
 * mismo redirigiendo a `/dashboard`.
 *
 * Se poda el estado de navegación COMPLETO y no solo la pantalla visible: en
 * mascotas o en zonas comunes el residente puede llevar tres pantallas
 * apiladas, y devolverlo una sola lo dejaría en otra del mismo módulo apagado.
 *
 * Vive sobre `navigationRef` porque el gateo tiene que alcanzar cualquier
 * pantalla de cualquier stack, y un hook dentro de un `Stack.Navigator` solo ve
 * el navegador que lo contiene.
 */
export function ModuleRouteGuard({
  navigationRef,
}: {
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}) {
  const enabledModules = useAuthStore(s => s.resident?.complex?.enabledModules);
  const { showInfo } = useAlert();

  useEffect(() => {
    const nav = navigationRef.current;
    if (!nav?.isReady()) return;

    const isEnabled = useAuthStore.getState().isModuleEnabled;
    const removed = new Set<string>();

    const prune = (state: AnyState): AnyState => {
      const routes: AnyRoute[] = [];
      for (const route of state.routes ?? []) {
        const module = SCREEN_MODULE[route.name];
        if (module && !isEnabled(module)) {
          removed.add(module);
          continue;
        }
        routes.push(route.state ? { ...route, state: prune(route.state) } : route);
      }
      // Defensivo: ninguna ruta de entrada de los stacks está gateada (`Home`,
      // `Main`, `ProfileTab`), así que esto no debería darse; vaciar un stack
      // dejaría la app en negro, y es peor que no podar.
      if (!routes.length) return state;
      return { ...state, routes, index: routes.length - 1 };
    };

    const pruned = prune(nav.getRootState() as unknown as AnyState);
    if (!removed.size) return;

    // Se poda ANTES de avisar: si el aviso fallara, el residente igual sale de
    // la pantalla muerta.
    nav.reset(pruned as unknown as NavigationState);

    // No hace falta memoria contra avisos repetidos. El efecto vuelve a correr
    // cuando el perfil se refresca con la misma lista, pero para entonces las
    // rutas ya no están en el estado y `removed` queda vacío.
    const names = [...removed].map(moduleLabel);
    showInfo(
      names.length === 1
        ? `La administración desactivó ${names[0]} en tu conjunto.`
        : `La administración desactivó estos módulos en tu conjunto: ${names.join(', ')}.`,
      'Módulo no disponible',
    );
  }, [enabledModules, navigationRef, showInfo]);

  return null;
}
