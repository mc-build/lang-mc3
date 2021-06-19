interface StackFrame {
  file: string;
  line: number;
  special?: string;
}
export enum ErrorType {
  CUSTOM,
  INVALID_IMPORT,
  EXPECTED_TOKEN_OPEN_LEFT_CURLY_BRACKET,
  EXPECTED_TOKEN_OPEN_RIGHT_CURLY_BRACKET,
}
export class CompileTimeError extends Error {
  public static Errors = ErrorType;
  private static _stack: StackFrame[] = [];
  static push_stack(frame: StackFrame) {
    CompileTimeError._stack.push(frame);
  }
  static pop_stack() {
    CompileTimeError._stack.pop();
  }
  static reset() {
    CompileTimeError._stack = [];
  }

  public error: ErrorType;
  public message: string = "";
  public stack: string = "";
  constructor(error: ErrorType, message: string) {
    super(ErrorType[error]);
    this.error = error;
    this.message = message;
    this.stack = this.computeStack();
  }
  private computeStack() {
    let result: string[] = [];
    for (let i = 0; i < CompileTimeError._stack.length; i++) {
      const frame: StackFrame = CompileTimeError._stack[i];
      if (frame.special) {
        result.unshift(`- ${frame.file}@${frame.special}`);
      } else result.unshift(`- ${frame.file}@${frame.line + 1}`);
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
