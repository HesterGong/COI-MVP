export function randomId(prefix = 'application') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function COIRequested(payload) {
  return { type: 'COIRequested', ...payload };
}

export function COILobGenerationCompleted(payload) {
  return { type: 'COILobGenerationCompleted', ...payload };
}
