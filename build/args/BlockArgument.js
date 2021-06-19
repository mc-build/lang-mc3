"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockArgument = void 0;
const brigadier_1 = require("@mc-build/brigadier");
const CachableArgument_1 = require("./CachableArgument");
class BlockArgument extends CachableArgument_1.CacheableArgument {
    constructor(file, skip, cache = true) {
        super();
        this.file = file;
        this.name = "";
        this.block = null;
        this.skip = skip;
        this.useCache = cache;
    }
    parse(reader) {
        if (!this.skip) {
            let call = reader.readUnquotedString();
            if (call != "_block") {
                throw new Error("invalid block reference");
            }
            reader.read();
        }
        this.name = reader.readUnquotedString();
        this.block = this.file.getBlock(this.name);
        if (this.useCache)
            this.cache({ name: this.name, block: this.block });
        return this;
    }
    listSuggestions(context, builder) {
        return brigadier_1.Suggestions.empty();
    }
    getExamples() {
        return ["1 2 3"];
    }
}
exports.BlockArgument = BlockArgument;
;
