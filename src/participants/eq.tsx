import { MCLang3File } from "../MCLang3File";
import * as B from "@mc-build/brigadier";
import * as mathjs from "mathjs";
class ScoreConstant {
  value: number;
  name: string;
  objective: string;
  isConst: boolean;
  constructor(value: number) {
    this.value = Math.floor(value);
    this.name = "#" + this.value;
    this.objective = "const";
    this.isConst = true;
  }
  build() {
    return {
      o: `${this.name} ${this.objective}`,
      v: this.value,
      clean: true,
      useSet: true,
    };
  }
  static eval(a: { value: number; }, op: any, b: { value: number; }) {
    let res = null;
    switch (op) {
      case "+":
        res = a.value + b.value;
        break;
      case "-":
        res = a.value - b.value;
        break;
      case "*":
        res = a.value * b.value;
        break;
      case "/":
        res = a.value / b.value;
        break;
      case "<":
        res = Math.min(a.value, b.value);
        break;
      case ">":
        res = Math.max(a.value, b.value);
        break;
      case "%":
        res = a.value % b.value;
        break;
      case "-=":
      case "+=":
      case "/=":
      case "*=":
      case "%=":
      case "=":
        throw new Error("invalid operation");
    }
    //@ts-ignore
    return new ScoreConstant(res | 0);
  }
}
class ScoreHolder {
  name: any;
  objective: any;
  constructor(name: any, objective: any) {
    this.name = name;
    this.objective = objective;
  }
  build() {
    return { o: `${this.name} ${this.objective}`, clean: true, useSet: false };
  }
}
class Op {
  left: boolean;
  right: any;
  op: string;
  isOp: boolean;
  isConst: any;
  name: any;
  objective: any;
  value: any;
  constructor(left: boolean, right: any, op: string) {
    this.left = left;
    this.right = right;
    this.op = op;
    this.isOp = true;
    //@ts-ignore
    if (Op.reversableOps.includes(this.op) && this.left.isConst) {
      [this.left, this.right] = [this.right, this.left];
    }
    //@ts-ignore
    if (this.left.isConst && this.right.isConst) {
      this.isOp = false;
      //@ts-ignore
      Object.assign(this, ScoreConstant.eval(this.left, this.op, this.right));
    }
  }
  optimize() {}
  static reversableOps = ["+", "*", "<", ">"];
  static transforms = {
    "%": "%=",
    "*": "*=",
    "+": "+=",
    "-": "-=",
    "/": "/=",
    "<": "<",
    ">": ">",
    "=": "=",
    "%=": "%=",
    "*=": "*=",
    "-=": "-=",
    "+=": "+=",
    "/=": "/=",
  };
  static optimizableOps = ["-", "+", "-=", "+=", "=", "<", ">"];
  static executionOrder = [
    ["=", "%", "%=", "<", ">", "*", "*="],
    ["/", "/="],
    ["+", "+=", "-", "-="],
  ];
  static getPriority(op: string) {
    return Op.executionOrder[
    //@ts-ignore
      Op.executionOrder.find((list) => list.includes(op))
    ];
  }
  get priority() {
    return Op.getPriority(this.op);
  }
  //PEMDAS
  canBeOptimize() {
    return this.right.isConst && Op.optimizableOps.includes(this.op);
  }
  build(arr = [], temp: () => any) {
    if (this.isConst) {
      return {
        o: `${this.name} ${this.objective}`,
        v: this.value,
        clean: true,
        useSet: true,
      };
    }
    this.optimize();
    let my = [];
    //@ts-ignore
    let left = this.left.build(arr, temp);
    if (left.clean && !this.op.includes("=")) {
      let new_left = { o: `${temp()} temp`, clean: false };
      if (left.useSet) {
        my.push(`scoreboard players set ${new_left.o} ${left.v}`);
      } else {
        my.push(`scoreboard players operation ${new_left.o} = ${left.o}`);
      }
      left = new_left;
    }
    if (this.canBeOptimize()) {
      let op = "add",
        invert = "remove";
      let value = this.right.value;
      let use = null;
      switch (this.op) {
        case "-=":
        case "-":
          op = "remove";
          invert = "add";
          break;
        case "=":
          use = op = invert = "set";
          break;
      }
      if (value < 0) {
        use = invert;
        value *= -1;
      } else if (value > 0) {
        use = op;
      }
      if (use) {
        my.push(`scoreboard players ${use} ${left.o} ${value}`);
        //@ts-ignore
      } else if (this.left instanceof ScoreHolder) {
        return this.left.build();
      }
    } else {
      let right = this.right.build(arr, temp, true).o;
      if (this.op !== "=" || right !== left.o) {
        my.push(
          `scoreboard players operation ${left.o} ${
            //@ts-ignore
            Op.transforms[this.op]
          } ${right}`
        );
      }
    }
    //@ts-ignore
    arr.push(...my);
    return left;
  }
}
const operations = ["+", "-", "/", "*", "%", "="];
const punctuation = ["(", ")", ...operations];
function isNumber(part: string) {
  return /^-*[0-9]+(\.[0-9]+)?$/.test(part);
}
function fixup(parts: string | any[]) {
  let res = [];
  for (let i = 0; i < parts.length - 1; i++) {
    if (
      !punctuation.includes(parts[i]) &&
      !punctuation.includes(parts[i + 1])
    ) {
      res.push(new ScoreHolder(parts[i], parts[i + 1]));
      i++;
    } else if (isNumber(parts[i])) {
      res.push(new ScoreConstant(parts[i]));
    } else {
      res.push(parts[i]);
    }
  }
  if (punctuation.includes(parts[parts.length - 1])) {
    res.push(parts[parts.length - 1]);
  } else if (isNumber(parts[parts.length - 1])) {
    res.push(new ScoreConstant(parts[parts.length - 1]));
  }
  return res;
}
function parse(parts: any, str: string) {
  const res = ["#equation: " + str];
  let id = 0;
  let sid = 0;
  const parts2 = fixup(parts);
  const lookup = new Map();
  //@ts-ignore
  function itterate(node: { type: any; content: any; args: any[]; op: any; name: any; }) {
    switch (node.type) {
      case "ParenthesisNode":
        return itterate(node.content);
      case "OperatorNode":
        return new Op(itterate(node.args[0]), itterate(node.args[1]), node.op);
      case "SymbolNode":
        return lookup.get(node.name);
      default:
        console.log(node.type, node);
    }
  }
  let eq = parts2
    .map((part) => {
      if (typeof part === "string") {
        return part;
      } else {
        const _id = "$$" + id++;
        lookup.set(_id, part);
        return _id;
      }
    })
    .join(" ");
  let equals = false;
  if (eq.startsWith("$$0 =")) {
    equals = lookup.get("$$0");
    eq = eq.substr(6);
  }
  //@ts-ignore
  let tree = itterate(mathjs.parse(eq));
  if (equals) {
    tree = new Op(equals, tree, "=");
  }
  tree.build(res, () => sid++);
  return res;
}
export const bind = ({
  get,
  file,
}: {
  get: (name: "top" | "generic") => B.CommandDispatcher<unknown>,
  file: MCLang3File,
}) => {
  //@ts-ignore
  get("generic").register(
    B.literal("eq").then(
      //@ts-ignore
      B.argument("expr", B.greedyString()).executes((ctx) => {
        const parts = ctx
          .getArgument("expr")
          .replace(/([=()+\-*%/])/g, " $1 ")
          .split(" ")
          .filter(Boolean);
        return parse(parts, ctx.getArgument("expr"));
      })
    )
  );
};
