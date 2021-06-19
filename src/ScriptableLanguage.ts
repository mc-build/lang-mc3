const lang = require("!config/mc3").lang;
export const languages: Record<string, ScriptableLanguage> = {};
export type Env = Record<string, any>;
export class ScriptableLanguage {
  env:any;
  constructor(name: string) {
    languages[name] = this;
  }
  async evaluateInlineBlocks(code: string, env: Env): Promise<any> {
    console.log(
      "please implement async ScriptableLanguage.evaluateInlineBlocks(code:string,env:Env):Promise<any>"
    );
    throw new Error("NOT IMPLEMENTED ERROR");
  }
  async evaluateCode(code: string, env: Env): Promise<any> {
    console.log(
      "please implement async ScriptableLanguage.evaluateCode(code:string,env:Env):Promise<any>"
    );
    throw new Error("NOT IMPLEMENTED ERROR");
  }
  static evaluateInlineBlocks(code: string, env: Env): Promise<any> {
    return languages[lang].evaluateInlineBlocks(code, env);
  }
  static evaluateCode(code: string, env: Env): Promise<any> {
    return languages[lang].evaluateCode(code, env);
  }
  static get baseEnv(){
    return languages[lang].env || {};
  }
}
