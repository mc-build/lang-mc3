const B = require("@jsprismarine/brigadier");
let cachableArguments = [];
function resetCachableArguments() {
  cachableArguments.forEach((arg) => arg.reset());
}
class CacheableArgument {
  constructor() {
    this._cache = [];
    cachableArguments.push(this);
  }
  reset() {
    this._cache = [];
  }
  copyOf(o) {
    let copy = Object.assign(Object.create(null), o);
    if (Reflect.has(copy, "_cache")) {
      delete copy._cache;
    }
    return Object.freeze(copy);
  }
  getHistory() {
    return this._cache;
  }
  cache() {
    this._cache.push(this.copyOf(this));
  }
}
class BlockArgument extends CacheableArgument {
  constructor(api, skip) {
    super();
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
    this.cache();
    return this;
  }
  listSuggestions(context, builder) {
    return B.Suggestions.empty();
  }
  getExamples() {
    return ["1 2 3"];
  }
}
class ScriptArgument extends CacheableArgument {
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
}

const CD = new B.CommandDispatcher();
const IF = CD.register(B.literal("IF"));
const compileTimeIfStatement = (ctx) => {
  console.log("Exec");
  const block = ctx.getArgument("block").getHistory();
  const conditions = ctx.getArgument("script").getHistory();
  return {
    block,
    conditions,
  };
};
CD.register(
  B.literal("IF").then(
    B.argument("script", new ScriptArgument()).then(
      B.argument("block", new BlockArgument())
        .executes(compileTimeIfStatement)
        .then(
          B.literal("ELSE")
            .then(
              B.literal("_call").then(
                B.argument("block2", new BlockArgument({}, true)).executes(
                  (ctx) => {
                    ctx
                      .getSource()
                      .addConditional(`(true)`, ctx.getArgument("block2").name);
                    return compileTimeIfStatement(ctx);
                  }
                )
              )
            )
            .then(B.literal("IF").forward(IF))
        )
    )
  )
);
function getSource() {
  return {
    data: [],
    addConditional(s, b) {
      this.data.push({ script: s, block: b });
      return this;
    },
  };
}
console.log("A");
resetCachableArguments();
CD.execute("IF (a+b==2) _call 0", getSource());
console.log("B");
resetCachableArguments();
CD.execute("IF (a+b==2) _call 0 ELSE _call 1", getSource());
console.log("C");
resetCachableArguments();
CD.execute("IF (a+b==2) _call 0 ELSE IF (a==1) _call 1", getSource());
console.log("D");
resetCachableArguments();
CD.execute(
  "IF (a+b==2) _call 0 ELSE IF (a==1) _call 1 ELSE _call 2",
  getSource()
);
console.log("E");
resetCachableArguments();
console.log(
  JSON.stringify(
    CD.execute(
      "IF (i%15 === 0) _call 7 ELSE IF (i%3===0) _call 8 ELSE IF (i % 5 === 0) _call 9 ELSE _call 10",
      getSource()
    )
  )
);

console.log(JSON.stringify(IfLiteral));
