import get from 'lodash.get';

export function mapData(ctx, mappings) {
  return Object.fromEntries(
    Object.entries(mappings).map(([k, path]) => [k, get(ctx, path)])
  );
}
