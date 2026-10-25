/** Small event emitter with snapshot iteration and idempotent unsubscribe functions. */
export class EventEmitter {
  constructor() { this.listeners = new Map(); this.disposed = false; }
  on(type, listener, { once = false, signal } = {}) {
    this._assertActive();
    if (typeof type !== "string" || !type.trim() || typeof listener !== "function") throw new TypeError("on() requires an event name and listener.");
    if (signal?.aborted) return () => {};
    const record = { listener, once };
    const set = this.listeners.get(type) ?? new Set();
    set.add(record); this.listeners.set(type, set);
    const off = () => {
      set.delete(record);
      if (set.size === 0) this.listeners.delete(type);
      signal?.removeEventListener("abort", off);
    };
    signal?.addEventListener("abort", off, { once: true });
    return off;
  }
  once(type, listener, options = {}) { return this.on(type, listener, { ...options, once: true }); }
  emit(type, ...args) {
    this._assertActive();
    const snapshot = [...(this.listeners.get(type) ?? [])];
    for (const record of snapshot) {
      const current = this.listeners.get(type);
      if (!current?.has(record)) continue;
      if (record.once) current.delete(record);
      record.listener(...args);
      if (record.once && current.size === 0) this.listeners.delete(type);
    }
    return snapshot.length > 0;
  }
  off(type, listener) {
    const set = this.listeners.get(type);
    if (!set) return false;
    let removed = false;
    for (const record of set) if (record.listener === listener) removed = set.delete(record) || removed;
    if (set.size === 0) this.listeners.delete(type);
    return removed;
  }
  removeAllListeners(type) { if (type === undefined) this.listeners.clear(); else this.listeners.delete(type); }
  _assertActive() { if (this.disposed) throw new Error("EventEmitter has been disposed."); }
  dispose() { if (this.disposed) return; this.removeAllListeners(); this.disposed = true; }
}
