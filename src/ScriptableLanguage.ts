import { MCLang3File } from "./MCLang3File";

const lang = require("!config/mc3").lang;
export const languages: Record<string, ScriptableLanguage> = {};
export type Env = Record<string, any>;
export class ScriptableLanguage {
  env:any;
  file!: MCLang3File;
  constructor(name: string) {
    languages[name] = this;
  }
  async evaluateInlineBlocks(code: string, env: Env,addToScope:null|((item:any)=>void)): Promise<any> {
    console.log(
      "please implement async ScriptableLanguage.evaluateInlineBlocks(code:string,env:Env):Promise<any>"
    );
    throw new Error("NOT IMPLEMENTED ERROR");
  }
  async evaluateCode(code: string, env: Env,addToScope:null|((item:any)=>void)): Promise<any> {
    console.log(
      "please implement async ScriptableLanguage.evaluateCode(code:string,env:Env):Promise<any>"
    );
    throw new Error("NOT IMPLEMENTED ERROR");
  }
  static evaluateInlineBlocks(code: string, env: Env,addToScope:null|((item:any)=>void)): Promise<any> {
    return languages[lang].evaluateInlineBlocks(code, env,addToScope);
  }
  static evaluateCode(code: string, env: Env,addToScope:null|((item:any)=>void)): Promise<any> {
    return languages[lang].evaluateCode(code, env,addToScope);
  }
  static get baseEnv(){
    return languages[lang].env || {};
  }
  static setFile(file: MCLang3File) {
    languages[lang].setFile(file);
  }
  setFile(file:MCLang3File){
    throw new Error("PLEASE OVERWRITE setFile");
  }
}
