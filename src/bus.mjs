export class InMemoryEventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.subscribers = new Map();
  }

  subscribe(type, handler) {
    if (!this.subscribers.has(type)) this.subscribers.set(type, new Set());
    this.subscribers.get(type).add(handler);
    return () => this.subscribers.get(type)?.delete(handler);
  }

  async publish(evt) {
    const handlers = Array.from(this.subscribers.get(evt.type) ?? []);
    // Run sequentially for determinism in this MVP.
    for (const h of handlers) await h(evt);
  }
}
