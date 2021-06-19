"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompileTimeError = exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    ErrorType[ErrorType["CUSTOM"] = 0] = "CUSTOM";
    ErrorType[ErrorType["INVALID_IMPORT"] = 1] = "INVALID_IMPORT";
    ErrorType[ErrorType["EXPECTED_TOKEN_OPEN_LEFT_CURLY_BRACKET"] = 2] = "EXPECTED_TOKEN_OPEN_LEFT_CURLY_BRACKET";
    ErrorType[ErrorType["EXPECTED_TOKEN_OPEN_RIGHT_CURLY_BRACKET"] = 3] = "EXPECTED_TOKEN_OPEN_RIGHT_CURLY_BRACKET";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
class CompileTimeError extends Error {
    constructor(error, message) {
        super(ErrorType[error]);
        this.message = "";
        this.stack = "";
        this.error = error;
        this.message = message;
        this.stack = this.computeStack();
    }
    static push_stack(frame) {
        CompileTimeError._stack.push(frame);
    }
    static pop_stack() {
        CompileTimeError._stack.pop();
    }
    static reset() {
        CompileTimeError._stack = [];
    }
    computeStack() {
        let result = [];
        for (let i = 0; i < CompileTimeError._stack.length; i++) {
            const frame = CompileTimeError._stack[i];
            if (frame.special) {
                result.unshift(`- ${frame.file}@${frame.special}`);
            }
            else
                result.unshift(`- ${frame.file}@${frame.line + 1}`);
        }
        result.unshift(`${this.message}`);
        return result.join("\n");
    }
    [Symbol.toStringTag]() {
        return this.stack;
    }
    toString() {
        return this.stack;
    }
}
exports.CompileTimeError = CompileTimeError;
CompileTimeError.Errors = ErrorType;
CompileTimeError._stack = [];
