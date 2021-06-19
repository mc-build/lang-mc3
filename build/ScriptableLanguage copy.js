"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptableLanguage = exports.languages = void 0;
const lang = require("!config/mc3").lang;
exports.languages = {};
class ScriptableLanguage {
    constructor(name) {
        exports.languages[name] = this;
    }
    async evaluateInlineBlocks(code, env) {
        console.log("please implement async ScriptableLanguage.evaluateInlineBlocks(code:string,env:Env):Promise<any>");
        throw new Error("NOT IMPLEMENTED ERROR");
    }
    async evaluateCode(code, env) {
        console.log("please implement async ScriptableLanguage.evaluateCode(code:string,env:Env):Promise<any>");
        throw new Error("NOT IMPLEMENTED ERROR");
    }
    static evaluateInlineBlocks(code, env) {
        return exports.languages[lang].evaluateInlineBlocks(code, env);
    }
    static evaluateCode(code, env) {
        return exports.languages[lang].evaluateCode(code, env);
    }
}
exports.ScriptableLanguage = ScriptableLanguage;
