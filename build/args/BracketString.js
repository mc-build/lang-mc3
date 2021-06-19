"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BracketString = void 0;
const brigadier_1 = require("@mc-build/brigadier");
class BracketString {
    parse(reader) {
        let brackets = [];
        let inQuote = null;
        while ((brackets.length || reader.peek() != " ") && reader.canRead()) {
            let char = reader.read();
            switch (char) {
                case '"':
                case "'":
                    if (inQuote === char) {
                        inQuote = null;
                    }
                    else {
                        inQuote = char;
                    }
                    break;
            }
            if (!inQuote) {
                switch (char) {
                    case "{":
                    case "[":
                        brackets.push(char);
                        break;
                    case "}":
                        if (brackets[brackets.length - 1] === "{")
                            brackets.pop();
                        break;
                    case "]":
                        if (brackets[brackets.length - 1] === "[")
                            brackets.pop();
                }
            }
        }
        return this;
    }
    listSuggestions(context, builder) {
        return brigadier_1.Suggestions.empty();
    }
    getExamples() {
        return ["1 2 3"];
    }
}
exports.BracketString = BracketString;
;
