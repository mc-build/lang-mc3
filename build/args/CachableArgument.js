"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheableArgument = void 0;
class Cache {
    constructor() {
        this.data = [];
    }
    insert(item) {
        const ref = new WeakRef(item);
        const id = Math.random().toString(16).substr(2);
        this.data.push({
            id,
            reset() {
                const arg = ref.deref();
                if (arg) {
                    arg.reset();
                }
                else {
                    this.data = (this.data || []).filter((item) => item.id != id);
                }
            },
        });
    }
    reset() {
        this.data.forEach((entry) => entry.reset());
    }
}
const ArgumentCache = new Cache();
class CacheableArgument {
    constructor() {
        this._cache = [];
        ArgumentCache.insert(this);
    }
    static reset() {
        ArgumentCache.reset();
    }
    reset() {
        this._cache = [];
    }
    copyOf(o) {
        let copy = Object.assign(Object.create(null), o);
        if (Reflect.has(copy, "_cache")) {
            delete copy._cache;
        }
        return Object.freeze(copy);
    }
    getHistory() {
        return this._cache;
    }
    cache(o) {
        this._cache.push(this.copyOf(o || this));
    }
}
exports.CacheableArgument = CacheableArgument;
;
