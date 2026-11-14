import { complexSwitchTarget } from '../src/presentation/utils/complexSwitchTarget';

const mine = [
  { complexId: 'a', complexName: 'Alameda', isCurrent: true, unreadCount: 0 },
  { complexId: 'b', complexName: 'Mirador', isCurrent: false, unreadCount: 2 },
];

describe('complexSwitchTarget', () => {
  it('aviso del conjunto abierto: no cambia', () => {
    expect(complexSwitchTarget('a', 'a', mine)).toBe('none');
  });

  it('aviso de otro conjunto donde vive: cambia', () => {
    expect(complexSwitchTarget('b', 'a', mine)).toBe('switch');
  });

  it('aviso de un conjunto donde ya no vive: solo la bandeja', () => {
    expect(complexSwitchTarget('z', 'a', mine)).toBe('inbox');
  });

  it('aviso sin conjunto: no cambia', () => {
    expect(complexSwitchTarget(undefined, 'a', mine)).toBe('none');
    expect(complexSwitchTarget('', 'a', mine)).toBe('none');
  });
});
