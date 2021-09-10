import { CompileTimeError } from "../CompileTimeError";
import { MCLang3File } from "../MCLang3File";
import { Env, ScriptableLanguage } from "../ScriptableLanguage";
new (class Javascript extends ScriptableLanguage {
  file!: MCLang3File;
  constructor() {
    super("Javascript");
  }
  async evaluateCode(code: string, env: Env,addToScope:(item:any)=>void) {
    let args = [];
    let params = [];
    for (let name in env) {
      params.push(name);
      args.push(env[name]);
    }
    params.push("emit");
    args.push(addToScope);
    params.push(`return async function(){\n${code}\n}`);
    try{
      return new Function(...params)(...args)();
    }catch(e){
      debugger;
      throw e;
    }
  }
  evaluateInlineBlocks(code: string, env: Env,addToScope:(item:any)=>void) {
    if (code.indexOf("<%") > -1 && code.indexOf("%>") > -1) {
      const template = code
        .replace(/\${/g, '${"${"}')
        .replace(/\\/g, "\\\\")
        .replace(/<%/g, "${")
        .replace(/%>/g, "}")
        .replace(/\`/g, "\\`");
      try {
        return this.evaluateCode("return `" + template + "`", env,addToScope);
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
  setFile(file: MCLang3File) {
    this.file = file;
  }
})();
