"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CompileTimeError_1 = require("../CompileTimeError");
const ScriptableLanguage_1 = require("../ScriptableLanguage");
new (class Javascript extends ScriptableLanguage_1.ScriptableLanguage {
    constructor() {
        super("Javascript");
        this.env = {};
    }
    async evaluateCode(code, env, addToScope) {
        let args = [];
        let params = [];
        for (let name in env) {
            params.push(name);
            args.push(env[name]);
        }
        params.push("emit");
        args.push(addToScope);
        params.push(`return async function(){\n${code}\n}`);
        try {
            return new Function(...params)(...args)();
        }
        catch (e) {
            debugger;
            throw e;
        }
    }
    evaluateInlineBlocks(code, env, addToScope) {
        if (code.indexOf("<%") > -1 && code.indexOf("%>") > -1) {
            const template = code
                .replace(/\${/g, '${"${"}')
                .replace(/\\/g, "\\\\")
                .replace(/<%/g, "${")
                .replace(/%>/g, "}")
                .replace(/\`/g, "\\`");
            try {
                return this.evaluateCode("return `" + template + "`", env, addToScope);
            }
            catch (e) {
                throw new CompileTimeError_1.CompileTimeError(CompileTimeError_1.CompileTimeError.Errors.CUSTOM, `invalid template literal '${template}'`);
            }
        }
        return Promise.resolve(code);
    }
    setFile(file) {
        this.file = file;
    }
})();
