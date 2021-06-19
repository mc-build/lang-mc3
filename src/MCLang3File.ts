const { getCacheLocation } = require("!io");
import * as path from "path";
import { existsSync, readFileSync } from "fs";
import { CompileTimeError } from "./CompileTimeError";
import { hashString } from "./util/hashString";
import { fileCache } from "./fileCache";
import { Token, tokenize } from "./tokenizer";
import * as B from "@mc-build/brigadier";
import { gather } from "./Consumer";
import { ScriptableLanguage } from "./ScriptableLanguage";
import { writeFileSync } from "fs";
import { builder, reset_builder } from "./builder";

const logger = require("!logger");
const cache_location = getCacheLocation("lang-mc3");
function clean(o: any) {
  const seen = new Set();
  async function _clean(o: any, unsafe = false) {
    if (typeof o != "object" || !o || (seen.has(o) && !unsafe)) return o;
    const keys = Object.keys(o);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (o[key] instanceof Promise) {
        const res = await _clean(await o[key]);
        //@ts-ignore
        seen.add(res);
        o[key] = res;
      } else {
        let safe = seen.has(o[key]);
        seen.add(o[key]);
        await _clean(o[key], !safe);
      }
    }
    return o;
  }
  return _clean(o);
}
export enum FileType {
  MC,
  MCM,
}
export class ILT {
  token: Token;
  value: string;
  parent: Token | Block;
  constructor(token: Token, value: string,parent:Token|Block) {
    this.token = token;
    this.value = value;
    this.parent = parent;
  }
}
function mergeTokens(list: ILT[]) {
  let result = [];
  let start = -1;
  let acc = [];
  for(let i = 0;i<list.length;i++){
    const parent:Token|Block = list[i].parent;
    if(parent instanceof Block){
      if(start === -1 || parent.line === start){
        acc.push(list[i]);
        start = parent.last_line
      }else{
        if(acc.length > 0){
          result.push(new ILT(acc[0].token,acc.map(_=>_.value).join(" "),acc[0].parent));
          acc = [];
          start = -1;
        }
        result.push(list[i]);
      }
    }else if(parent instanceof Token){
      if(start === -1 || parent.line === start){
        acc.push(list[i]);
        start = parent.line
      }else{
        if(acc.length > 0){
          result.push(new ILT(acc[0].token,acc.map(_=>_.value).join(" "),acc[0].parent));
          acc = [];
          start = -1;
        }
        result.push(list[i]);
      }
    }
  }
  if(acc.length > 0){
    result.push(new ILT(acc[0].token,acc.map(_=>_.value).join(" "),acc[0].parent));
  }
  return result;
}
class Block {
  tokens: (Token | Block | undefined)[];
  start: Token | undefined;
  file: MCLang3File;
  last_line: number;
  line: number;
  constructor(tokens: Token[], file: MCLang3File, validate = true) {
    this.file = file;
    this.tokens = [];
    const start = tokens.shift();
    this.start = start;
    let lbracket = tokens.shift();
    if (lbracket?.value !== "{" && validate) {
      throw new CompileTimeError(
        CompileTimeError.Errors.EXPECTED_TOKEN_OPEN_LEFT_CURLY_BRACKET,
        `Expected '{' got '${lbracket?.value || "NOTHING"}'`
      );
    }
    while (tokens.length && tokens[0].value !== "}") {
      if (tokens.length && tokens[1]?.value === "{") {
        this.tokens.push(new Block(tokens, file));
      } else {
        this.tokens.push(tokens.shift());
      }
    }
    // this.tokens = mergeTokens(this.tokens);
    const end = tokens.shift();
    this.line = start?.line || -1;
    this.last_line = end?.line || -1;
    if (end?.value !== "}") {
      throw new CompileTimeError(
        CompileTimeError.Errors.EXPECTED_TOKEN_OPEN_RIGHT_CURLY_BRACKET,
        `Expected '}' got '${end?.value || "NOTHING"}'`
      );
    }
  }
  toIL(id: number, start: string, IL: Record<string, ILT[]>) {
    const MY_ID = `${start + id}`;
    IL[MY_ID] = this.tokens
      .filter((item) => item != undefined)
      .map((_, i) => (_ as Token | Block).toIL(i, start + id + "_", IL));
    IL[MY_ID] = mergeTokens(IL[MY_ID]);
    return new ILT(
      this.start as Token,
      `${this.start?.value.trim()} _block ${start + id}`,
      this
    );
  }
}
export class MCLang3File {
  dependencies: Set<MCLang3File> = new Set();
  dependents: Set<MCLang3File> = new Set();
  data: string = "";
  raw_lines: string[] = [];
  file_path: string = "";
  type: FileType;
  hash: string | null = null;
  exports: Map<string, unknown> = new Map();
  handlers: Map<string, B.CommandDispatcher<string>> = new Map();
  blocks: Record<string, ILT[]>;
  constructor(file_path: string) {
    this.type = file_path.endsWith(".mc") ? FileType.MC : FileType.MCM;
    this.file_path = file_path;
    this.blocks = {};
  }
  getBlock(name: string) {
    return this.blocks[name];
  }
  addExport(name: string, callable: Function) {
    this.exports.set(name,callable);
  }
  async execute(type: string, ilc: ILT, source: any) {
    CompileTimeError.push_stack({
      file: this.file_path,
      line: ilc.token.line,
    });
    const line = await ScriptableLanguage.evaluateInlineBlocks(
      ilc.value,
      source.env
    );
    let res = line;
    try {
      res = (await this.handlers.get(type)?.executeAsync(res, source)) || res;
    } catch (e) {}
    CompileTimeError.pop_stack();
    return res;
  }
  async init(file_path: string) {
    this.file_path = file_path;
    CompileTimeError.push_stack({
      file: file_path,
      line: 0,
      special: "IMPORTS",
    });
    this.raw_lines = this.data.split("\n");
    let using_statements = [];
    for (let i = 0; i < this.raw_lines.length; i++) {
      CompileTimeError.push_stack({
        file: file_path,
        line: i,
      });
      const line = this.raw_lines[i].trim();
      if (line.startsWith("using ")) {
        const target = line.substr(6).trim();
        const local_location = path.resolve(this.file_path, "..", target);
        const module_location = path.resolve(cache_location, target + ".mcm");
        if (existsSync(local_location)) {
          using_statements.push(local_location);
        } else if (existsSync(module_location)) {
          using_statements.push(module_location);
        } else {
          throw new CompileTimeError(
            CompileTimeError.Errors.INVALID_IMPORT,
            `Invalid using statement '${line}'`
          );
        }
      } else if (line) {
        CompileTimeError.pop_stack();
        break;
      }
      CompileTimeError.pop_stack();
    }
    this.dependencies = new Set();
    for (let i = 0; i < using_statements.length; i++) {
      this.dependencies.add(await this.load(using_statements[i]));
    }
    this.dependencies.forEach((dependency) => dependency.addDependent(this));
    CompileTimeError.pop_stack();
  }
  async load(file_path: string) {
    if (!fileCache.has(file_path)) {
      fileCache.set(file_path, new MCLang3File(file_path));
    }
    await fileCache.get(file_path)?.update();
    return fileCache.get(file_path) as MCLang3File;
  }
  async update(force = false) {
    this.data = readFileSync(this.file_path, "utf8");
    let hash = hashString(this.data);
    const isSame = hash === this.hash;
    await this.init(this.file_path);
    if (isSame && !force) {
      CompileTimeError.pop_stack();
      return;
    }
    this.hash = hash;
    this.clean();
    await this.build(force);
  }
  clean() {
    this.exports = new Map();
  }
  async build(force: boolean) {
    CompileTimeError.push_stack({
      line: 0,
      file: this.file_path,
      special: "COMPILE",
    });
    CompileTimeError.push_stack({
      line: 0,
      file: this.file_path,
      special: "GET_CONSUMERS",
    });
    this.handlers = gather(this);
    CompileTimeError.pop_stack();
    const tokens = tokenize(
      this.file_path,
      readFileSync(this.file_path, "utf-8")
    );
    let _blocks = [];
    
    while (tokens.length) {
      if (!tokens[0].value.startsWith("using"))
        _blocks.push(new Block(tokens, this, false));
      else _blocks.push(tokens.shift());
    }
    const IL: Record<string, ILT[]> = {};
    const ROOT: ILT[] = [];
    for (let i = 0; i < _blocks.length; i++) {
      if (_blocks[i]) ROOT[i] = (_blocks[i] as Block).toIL(i, "block_", IL);
    }
    IL.root = ROOT;
    this.blocks = IL;
    const something = [];
    for (let i = 0; i < ROOT.length; i++) {
      let c = await this.execute("top", ROOT[i], {...ScriptableLanguage.baseEnv});
      something.push(...(await Promise.all(Array.isArray(c) ? c : [c])));
    }
    const cleaned = await clean(something);
    reset_builder(this);
    cleaned.forEach((element: any) => {
      if (typeof element !== "string") {
        builder(element);
      }
    });
    writeFileSync(
      "./debug.json",
      require("util").inspect(cleaned, { depth: Infinity })
    );
    // require("fs").writeFileSync(
    //   `./tree.${
    //     path.parse(this.file_path).name + "_" + path.parse(this.file_path).ext
    //   }.json`,
    //   JSON.stringify(something, null, 2)
    // );
    CompileTimeError.pop_stack();
    CompileTimeError.push_stack({
      line: 0,
      file: this.file_path,
      special: "BUILD_DEPENDENTS",
    });
    const toBuild = Array.from(this.dependents.keys());
    this.dependents = new Set();
    if (toBuild.length > 0) {
      logger.log(
        `building ${toBuild.length} additional file${
          toBuild.length === 1 ? "" : "s"
        }...`
      );
      await Promise.all(toBuild.map((file) => file.update(force)));
    }
    CompileTimeError.pop_stack();
  }
  addDependent(file: MCLang3File) {
    this.dependents.add(file);
  }
  getMacros() {
    type macroExport = {
      type: "macro";
      execute: (ctx: B.CommandContext<unknown>) => string[];
    };
    const macros: Record<string, macroExport["execute"]> = {};
    this.dependencies.forEach((dep) =>
      dep.exports.forEach((val, name) => {
        let _val = val as macroExport;
        if (_val.type === "macro") {
          macros[name] = _val.execute;
        }
      })
    );

    return macros;
  }
}
