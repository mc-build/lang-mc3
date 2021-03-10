const { Suggestions } = require("@jsprismarine/brigadier");
const CacheableArgument = require("./CachableArgument");
module.exports.ScriptArgument = class ScriptArgument extends CacheableArgument {
  constructor() {
    super();
    this.script = "";
  }
  parse(reader) {
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
    this.cache();
    return this;
  }
  listSuggestions(context, builder) {
    return Suggestions.empty();
  }
  getExamples() {
    return ["1 2 3"];
  }
};
