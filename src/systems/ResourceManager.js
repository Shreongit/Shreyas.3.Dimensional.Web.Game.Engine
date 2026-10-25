/**
 * Async resource cache with request de-duplication and explicit lifecycle.
 * Loaders receive (url, { signal, manager }); rejected loads are not cached.
 */
export class ResourceManager {
  constructor({ fetchImpl = globalThis.fetch } = {}) {
    if (typeof fetchImpl !== "function") throw new TypeError("ResourceManager requires fetch.");
    this.fetchImpl = fetchImpl;
    this.loaders = new Map();
    this.cache = new Map();
    this.pending = new Map();
    this.disposed = false;
    this.registerLoader("text", (url, ctx) => this._fetch(url, ctx).then(r => r.text()));
    this.registerLoader("json", (url, ctx) => this._fetch(url, ctx).then(r => r.json()));
    this.registerLoader("arrayBuffer", (url, ctx) => this._fetch(url, ctx).then(r => r.arrayBuffer()));
    this.registerLoader("blob", (url, ctx) => this._fetch(url, ctx).then(r => r.blob()));
  }
  registerLoader(type, loader) {
    this._assertActive();
    if (typeof type !== "string" || !type.trim() || typeof loader !== "function") throw new TypeError("Loader requires a type name and function.");
    this.loaders.set(type, loader);
    return this;
  }
  async load(url, type = "arrayBuffer", { signal, cache = true } = {}) {
    this._assertActive();
    if (typeof url !== "string" || !url.trim()) throw new TypeError("Resource URL must be a non-empty string.");
    const loader = this.loaders.get(type);
    if (!loader) throw new Error(`No resource loader registered for type "${type}".`);
    const key = `${type}:${url}`;
    if (cache && this.cache.has(key)) return this.cache.get(key);
    if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
    if (cache && this.pending.has(key)) return this.pending.get(key);
    const controller = new AbortController();
    const abort = () => controller.abort(signal.reason);
    signal?.addEventListener("abort", abort, { once: true });
    const promise = Promise.resolve().then(() => loader(url, { signal: controller.signal, manager: this })).then(value => {
      this._assertActive();
      if (cache) this.cache.set(key, value);
      return value;
    }).finally(() => {
      signal?.removeEventListener("abort", abort);
      if (this.pending.get(key) === promise) this.pending.delete(key);
    });
    if (cache) this.pending.set(key, promise);
    return promise;
  }
  async _fetch(url, { signal }) {
    const response = await this.fetchImpl(url, { signal });
    if (!response || !response.ok) throw new Error(`Failed to fetch "${url}"${response ? ` (HTTP ${response.status})` : ""}.`);
    return response;
  }
  get(url, type = "arrayBuffer") { return this.cache.get(`${type}:${url}`); }
  has(url, type = "arrayBuffer") { return this.cache.has(`${type}:${url}`); }
  invalidate(url, type) {
    if (type) return this.cache.delete(`${type}:${url}`);
    let removed = false;
    for (const key of this.cache.keys()) if (key.endsWith(`:${url}`)) removed = this.cache.delete(key) || removed;
    return removed;
  }
  clear() { this.cache.clear(); }
  _assertActive() { if (this.disposed) throw new Error("ResourceManager has been disposed."); }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.cache.clear();
    this.loaders.clear();
    // Pending fetches are controlled by their caller signal; the manager won't cache late results.
    this.pending.clear();
  }
}
