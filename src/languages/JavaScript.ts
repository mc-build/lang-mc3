import { CompileTimeError } from "../CompileTimeError";
import { Env, ScriptableLanguage } from "../ScriptableLanguage";
new (class Javascript extends ScriptableLanguage {
  constructor() {
    super("Javascript");
  }
  async evaluateCode(code: string, env: Env) {
    let args = [];
    let params = [];
    for (let name in env) {
      params.push(name);
      args.push(env[name]);
    }
    params.push(`return async function(){\n${code}\n}`);
    try{
      return new Function(...params)(...args)();
    }catch(e){
      debugger;
      throw e;
    }
  }
  evaluateInlineBlocks(code: string, env: Env) {
    if (code.indexOf("<%") > -1 && code.indexOf("%>") > -1) {
      const template = code
        .replace(/\${/g, '${"${"}')
        .replace(/\\/g, "\\\\")
        .replace(/<%/g, "${")
        .replace(/%>/g, "}")
        .replace(/\`/g, "\\`");
      try {
        return this.evaluateCode("return `" + template + "`", env);
      } catch (e) {
        throw new CompileTimeError(
          CompileTimeError.Errors.CUSTOM,
          `invalid template literal '${template}'`
        );
      }
    }
    return Promise.resolve(code);
  }
  env = {}
})();
