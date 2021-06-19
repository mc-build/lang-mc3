"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = exports.Token = void 0;
const MCLang3File_1 = require("./MCLang3File");
class Token {
    constructor(file, line, col, value) {
        this.file = file;
        this.line = line;
        this.col = col;
        this.value = value;
    }
    toIL(id, start, IL) {
        return new MCLang3File_1.ILT(this, this.value, this);
    }
}
exports.Token = Token;
function tokenize(file_name, content) {
    const lines = content.replace(/\r/g, "").split("\n");
    const tokens = [];
    let line_number = 0;
    for (let raw_line of lines) {
        let line = raw_line.trim();
        if (line.length > 0) {
            if (line[0] === "}") {
                tokens.push(new Token(file_name, line_number, raw_line.indexOf("}") + 1, "}"));
                line = line.substr(1);
            }
            if (line.endsWith("{")) {
                tokens.push(new Token(file_name, line_number, raw_line.indexOf(line), line.substr(0, line.length - 1)));
                tokens.push(new Token(file_name, line_number, raw_line.lastIndexOf("{") + 1, "{"));
            }
            else if (line) {
                tokens.push(new Token(file_name, line_number, raw_line.indexOf(line) + 1, line));
            }
        }
        line_number++;
    }
    return tokens;
}
exports.tokenize = tokenize;
