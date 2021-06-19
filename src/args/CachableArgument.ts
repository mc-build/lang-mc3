class Cache {
  data: any[];
  constructor() {
    this.data = [];
  }
  insert(item:any) {
    const ref = new WeakRef(item);
    const id = Math.random().toString(16).substr(2);
    this.data.push({
      id,
      reset() {
        const arg = ref.deref();
        if (arg) {
          arg.reset();
        } else {
          this.data = (this.data || []).filter((item:any) => item.id != id);
        }
      },
    });
  }
  reset() {
    this.data.forEach((entry) => entry.reset());
  }
}
const ArgumentCache = new Cache();
export class CacheableArgument {
  _cache: any[];
  static reset() {
    ArgumentCache.reset();
  }

  constructor() {
    this._cache = [];
    ArgumentCache.insert(this);
  }
  reset() {
    this._cache = [];
  }
  copyOf(o:any):any {
    let copy = Object.assign(Object.create(null), o);
    if (Reflect.has(copy, "_cache")) {
      delete copy._cache;
    }
    return Object.freeze(copy);
  }
  getHistory() {
    return this._cache;
  }
  cache(o?:any) {
    this._cache.push(this.copyOf(o || this));
  }
};
