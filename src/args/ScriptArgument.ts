// const { Suggestions } = require("@jsprismarine/brigadier");
import { Suggestions } from "@mc-build/brigadier";
import { CacheableArgument } from "./CachableArgument";
// const CacheableArgument = require("./CachableArgument");
export class ScriptArgument extends CacheableArgument {
  script: string;
  useCache: boolean;
  constructor(useCache:boolean=true) {
    super();
    this.script = "";
    this.useCache = useCache;
  }
  parse(reader:any) {
    let script = reader.read();
    let indent = 1;
    while (reader.canRead() && indent != 0) {
      const char = reader.read();
      switch (char) {
        case "(":
          indent++;
          break;
        case ")":
          indent--;
          break;
      }
      script += char;
    }
    this.script = script;
    if(this.useCache)this.cache();
    return this;
  }
  listSuggestions(context:any, builder:any) {
    return Suggestions.empty();
  }
  getExamples() {
    return ["1 2 3"];
  }
};
