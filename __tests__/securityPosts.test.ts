import { pickSecurityPost } from '../src/presentation/utils/securityPosts';

const NORTE = { id: 'norte', name: 'PORTERÍA NORTE', guardsOnDuty: 1, guardsWithApp: 1 };
const SUR = { id: 'sur', name: 'PORTERÍA SUR', guardsOnDuty: 0, guardsWithApp: 0 };

describe('pickSecurityPost', () => {
  it('con una sola portería la elige sola', () => {
    expect(pickSecurityPost([NORTE])).toBe(NORTE);
  });

  it('con varias obliga a elegir', () => {
    expect(pickSecurityPost([NORTE, SUR])).toBeUndefined();
  });

  it('respeta la que ya se eligió mientras exista', () => {
    expect(pickSecurityPost([NORTE, SUR], 'sur')).toBe(SUR);
    expect(pickSecurityPost([NORTE, SUR], 'borrada')).toBeUndefined();
  });

  it('sin porterías creadas no hay nada que elegir', () => {
    expect(pickSecurityPost([])).toBeUndefined();
  });
});
