import { hasPermissions } from '../../permissions/has-permissions.js';

describe('hasPermissions', () => {
  it('mode all exige todos', () => {
    expect(
      hasPermissions(['a:read', 'b:read'], ['a:read', 'b:read'], 'all'),
    ).toBe(true);
    expect(hasPermissions(['a:read'], ['a:read', 'b:read'], 'all')).toBe(false);
  });

  it('mode any exige al menos uno', () => {
    expect(hasPermissions(['a:read'], ['a:read', 'b:read'], 'any')).toBe(true);
    expect(hasPermissions(['c:read'], ['a:read', 'b:read'], 'any')).toBe(false);
  });
});
