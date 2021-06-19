import { ILT } from "./MCLang3File";

export class Token {
  file: string;
  line: number;
  col: number;
  value: string;
  constructor(file: string, line: number, col: number, value: string) {
    this.file = file;
    this.line = line;
    this.col = col;
    this.value = value;
  }
  toIL(id: number, start: string, IL: Record<string, ILT[]>) {
    return new ILT(this, this.value,this);
  }
}
export function tokenize(file_name: string, content: string) {
  const lines = content.replace(/\r/g, "").split("\n");
  const tokens: Token[] = [];
  let line_number = 0;
  for (let raw_line of lines) {
    let line = raw_line.trim();
    if (line.length > 0) {
      if (line[0] === "}") {
        tokens.push(
          new Token(file_name, line_number, raw_line.indexOf("}") + 1, "}")
        );
        line = line.substr(1);
      }
      if (line.endsWith("{")) {
        tokens.push(
          new Token(
            file_name,
            line_number,
            raw_line.indexOf(line),
            line.substr(0, line.length - 1)
          )
        );
        tokens.push(
          new Token(file_name, line_number, raw_line.lastIndexOf("{") + 1, "{")
        );
      } else if (line) {
        tokens.push(
          new Token(file_name, line_number, raw_line.indexOf(line) + 1, line)
        );
      }
    }
    line_number++;
  }

  return tokens;
}
