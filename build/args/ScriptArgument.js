"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptArgument = void 0;
// const { Suggestions } = require("@jsprismarine/brigadier");
const brigadier_1 = require("@mc-build/brigadier");
const CachableArgument_1 = require("./CachableArgument");
// const CacheableArgument = require("./CachableArgument");
class ScriptArgument extends CachableArgument_1.CacheableArgument {
    constructor(useCache = true) {
        super();
        this.script = "";
        this.useCache = useCache;
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
        if (this.useCache)
            this.cache();
        return this;
    }
    listSuggestions(context, builder) {
        return brigadier_1.Suggestions.empty();
    }
    getExamples() {
        return ["1 2 3"];
    }
}
exports.ScriptArgument = ScriptArgument;
;
