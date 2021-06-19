"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptableLanguageEnv = void 0;
class ScriptableLanguageEnvImpl {
    constructor() {
        this.frames = [];
    }
    push(env) {
        this.frames.push(env);
        return () => this.frames.splice(this.frames.indexOf(env), 1);
    }
    pop() {
        this.frames.pop();
    }
    reset() {
        this.frames = [];
    }
    get env() {
        return Object.assign({}, ...this.frames);
    }
}
exports.ScriptableLanguageEnv = new ScriptableLanguageEnvImpl;
