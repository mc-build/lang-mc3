
import {Suggestions} from "@mc-build/brigadier";
import {CacheableArgument} from "./CachableArgument";
export class BlockArgument extends CacheableArgument {
  file: any;
  name: string;
  block: null;
  skip: any;
  useCache: boolean;
  constructor(file: any, skip?: any,cache:boolean = true) {
    super();
    this.file = file;
    this.name = "";
    this.block = null;
    this.skip = skip;
    this.useCache = cache;
  }
  parse(reader: { readUnquotedString: () => any; read: () => void; }) {
    if (!this.skip) {
      let call = reader.readUnquotedString();
      if (call != "_block") {
        throw new Error("invalid block reference");
      }
      reader.read();
    }
    this.name = reader.readUnquotedString();
    this.block = this.file.getBlock(this.name);
    if(this.useCache)this.cache({ name: this.name, block: this.block });
    return this;
  }
  listSuggestions(context: any, builder: any) {
    return Suggestions.empty();
  }
  getExamples() {
    return ["1 2 3"];
  }
};
