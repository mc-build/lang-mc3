"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptableLanguage = exports.languages = void 0;
const lang = require("!config/mc3").lang;
exports.languages = {};
class ScriptableLanguage {
    constructor(name) {
        exports.languages[name] = this;
    }
    async evaluateInlineBlocks(code, env, addToScope) {
        console.log("please implement async ScriptableLanguage.evaluateInlineBlocks(code:string,env:Env):Promise<any>");
        throw new Error("NOT IMPLEMENTED ERROR");
    }
    async evaluateCode(code, env, addToScope) {
        console.log("please implement async ScriptableLanguage.evaluateCode(code:string,env:Env):Promise<any>");
        throw new Error("NOT IMPLEMENTED ERROR");
    }
    static evaluateInlineBlocks(code, env, addToScope) {
        return exports.languages[lang].evaluateInlineBlocks(code, env, addToScope);
    }
    static evaluateCode(code, env, addToScope) {
        return exports.languages[lang].evaluateCode(code, env, addToScope);
    }
    static get baseEnv() {
        return exports.languages[lang].env || {};
    }
    static setFile(file) {
        exports.languages[lang].setFile(file);
    }
    setFile(file) {
        throw new Error("PLEASE OVERWRITE setFile");
    }
}
exports.ScriptableLanguage = ScriptableLanguage;
