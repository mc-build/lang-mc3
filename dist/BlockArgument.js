const { Suggestions } = require("@jsprismarine/brigadier");
const CacheableArgument = require("./CachableArgument");
module.exports.BlockArgument = class BlockArgument extends CacheableArgument {
  constructor(api, skip) {
    super();
    this.api = api;
    this.name = "";
    this.block = null;
    this.skip = skip;
  }
  parse(reader) {
    if (!this.skip) {
      let call = reader.readUnquotedString();
      if (call != "_call") {
        throw new Error("invalid block reference");
      }
      reader.read();
    }
    this.name = reader.readUnquotedString();
    this.block = this.api.getBlockByName(this.name);
    this.cache({ name: this.name, block: this.block });
    return this;
  }
  listSuggestions(context, builder) {
    return Suggestions.empty();
  }
  getExamples() {
    return ["1 2 3"];
  }
};
