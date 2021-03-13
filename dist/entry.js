"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const B = require("@jsprismarine/brigadier");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("!config/mc");
const log = require("!logger");
const deepMerge = require("deep-extend");
const builder = require("./builder");
const Logger = require("./logUtil");
let namespaces = [];

const participants = {
  top: [],
  generic: [],
  compiler: [],
};
const SRC_DIR = path.resolve(process.cwd(), "SRC");

function getBlock(tokens) {
  const result = [];
  let indent = 0;
  do {
    const token = tokens.shift();
    if (token.value === "{") {
      indent++;
    } else if (token.value === "}") {
      indent--;
    }
    result.push(token);
  } while (tokens.length && indent);
  return result;
}
function bindCodeToEnv(code, env) {
  let args = [];
  let params = [];
  for (let name in env) {
    params.push(name);
    args.push(env[name]);
  }
  params.push(`return function(){\n${code}\n}`);
  return new Function(...params)(...args);
}
function evaluateCodeWithEnv(code, env) {
  return bindCodeToEnv(code, env)();
}
function strip(code) {
  if (code[0] === "(" && code[code.length - 1] === ")")
    return code.substr(1, code.length - 2);
  return code;
}
function evaluateValueWithEnv(code, env) {
  return bindCodeToEnv(`return (${strip(code)})`, env)();
}
function runCommandAsTemplateLiteral(line, env) {
  if (line.indexOf("<%") > -1 && line.indexOf("%>") > -1) {
    const template = line
      .replace(/\${/g, '${"${"}')
      .replace(/\\/g, "\\\\")
      .replace(/<%/g, "${")
      .replace(/%>/g, "}")
      .replace(/\`/g, "\\`");
    try {
      return evaluateCodeWithEnv("return `" + template + "`", env);
    } catch (e) {
      throw new Error(`invalid expression '${line}', ${e.message}`);
    }
  }
  return line;
}
class Token {
  constructor(line, value) {
    this.line = line;
    this.value = value;
    this.env = {};
  }
}
const tokenize = (str, offset = 0) => {
  let inML = false;
  return str.split("\n").reduce((p, n, index) => {
    n = n.trim();
    if (n.startsWith("###")) inML = !inML;
    if (inML || n.startsWith("###") || !n) return p;
    if (n[0] === "}") {
      p.push(new Token(index + offset, "}"));
      n = n.slice(1);
    }
    if (n[n.length - 1] === "{") {
      const v = n.slice(0, n.length - 1).trim();
      if (v) p.push(new Token(index + offset, v));
      p.push(new Token(index + offset, "{"));
    } else if (n) {
      p.push(new Token(index + offset, n));
    }
    return p;
  }, []);
};
class Block {
  constructor(name) {
    this.name = name || "unknown";
  }
  parse(reader) {
    this.name = reader.readString();
    if (!this.name.startsWith("BLOCK_")) {
      throw new SyntaxError(
        `Invalid block name '${this.name}' expected block name to start with 'BLOCK_'`
      );
    }
    return this;
  }
  listSuggestions(_context, _builder) {
    return B.Suggestions.empty();
  }
  getExamples() {
    return ["INTERNAL USE ONLY, YOU SHOULD NOT SEE THIS"];
  }
}
let TempEnv = {};
const CustomEnv = {};
let tokens;
const contextStack = [];
const initContext = () => {
  let res = {};
  contextStack.push(res);
};
const getCurrentContext = () => {
  return contextStack[contextStack.length - 1];
};
const getCompleteContext = () => {
  return deepMerge(
    {
      config,
      ...CustomEnv,
    },
    TempEnv,
    ...contextStack
  );
};
const popContext = () => contextStack.pop();
const editStack = [];
const initEdit = () => {
  let res = [];
  editStack.push(res);
  return res;
};
const finishEdit = () => {
  const edit = editStack.pop();
  const code =
    (edit === null || edit === void 0 ? void 0 : edit.join("\n")) || "";
  const inserts = tokenize(code, Math.random());
  const mergableEnv = deepMerge({}, {}, {}, TempEnv);
  tokens.unshift(
    ...inserts.map((token) => {
      token.env = deepMerge(token.env, mergableEnv);
      return token;
    })
  );
};
const cancelEdit = () => {
  editStack.pop();
};
const getEdit = () => editStack[editStack.length - 1];
let blocks = { root: [] };
let compileTime = new B.CommandDispatcher();
function getSingleLineFromTokenList(tokens) {
  let line = "";
  let lineNo = tokens[0].line;
  while (tokens.length && lineNo === tokens[0].line) {
    line += tokens[0].value;
    tokens.shift();
  }
  return line;
}
const populateCompileTimeParticipants = (participants) => {
  compileTime = new B.CommandDispatcher();
  compileTime.register(
    B.literal("macro").then(
      B.argument("name", B.string()).executes((context) => {
        console.log(context.getArgument("name"));
        getEdit().push("_macro " + context.getArgument("name"));
      })
    )
  );
  participants.forEach((participant) => {
    try {
      participant.participant(compileTime);
    } catch (e) {
      console.log(
        "encountered an unexpected error loading participant '" +
          participant.name +
          "'"
      );
    }
  });
};
function HandleCompileTime(code) {
  namespaces = [];
  editStack.splice(0, Infinity);
  contextStack.splice(0, Infinity);
  blocks = { root: [] };
  tokens = tokenize(code);
  TempEnv = {};
  let blockId = 0;
  function recurse() {
    var _a;
    initContext();
    const lines = [];
    let _last = tokens.shift();
    let lastLine = tokens[0].line;
    if (tokens[0].value === "}") {
      const last_line =
        (_a = tokens[0]) === null || _a === void 0 ? void 0 : _a.line;
      let id;
      if (config.dedupe) {
        id = crypto.createHash("md5").update(lines.join("\n")).digest("hex");
      } else {
        id = blockId++;
      }
      let ret = { id, last_line };
      blocks[ret.id] = [];
      tokens.shift();
      popContext();
      return ret;
    }
    let command = "";
    let added = false;
    do {
      added = false;
      TempEnv = tokens[0].env;
      if (tokens[0].line != lastLine) {
        const cmd = command.trim();
        lines.push(cmd);
        command = "";
        lastLine = tokens[0].line;
      }
      if (tokens[0].value === "{" && !added) {
        let res = recurse();
        command = command.trim() + " _call " + res.id + " ";
        lastLine = res.last_line || lastLine;
        if (tokens[0].value === "}" && !added) {
          const cmd = command.trim();
          // lines.push(command.trim());
          lines.push(cmd);
          command = "";
          lastLine = tokens[0].line;
        }
      } else {
        command += tokens[0].value;
        _last = tokens.shift();
        if (tokens[0].value === "}" && !added) {
          const cmd = command.trim();
          lines.push(cmd);
          command = "";
          lastLine = tokens[0].line;
        }
      }
    } while (tokens.length && tokens[0].value != "}");
    const last_line =
      (_a = tokens[0]) === null || _a === void 0 ? void 0 : _a.line;
    const last = tokens.shift();
    if ((last === null || last === void 0 ? void 0 : last.value) != "}") {
      throw new SyntaxError(
        `expected '}', got '${
          last === null || last === void 0 ? void 0 : last.value
        }'`
      );
    }
    if (command && !added) {
      lines.push(command);
    }
    let id;
    if (config.dedupe) {
      id = crypto.createHash("md5").update(lines.join("\n")).digest("hex");
    } else {
      id = blockId++;
    }
    let ret = { id, last_line };
    blocks[ret.id] = lines;
    popContext();
    return ret;
  }
  while (tokens.length) {
    let line = tokens[0].line;
    let command = "";
    while (tokens.length && tokens[0].line === line) {
      if (tokens[0].value === "{") {
        let res = recurse();
        command += " _call " + res.id;
        line = res.last_line || line;
      } else {
        command += tokens[0].value;
        tokens.shift();
      }
    }
    blocks.root = blocks.root || [];
    blocks.root.push(command.trim());
  }
  return blocks;
}
let api_blocks_ref = {};
const api = {
  CustomEnv,
  Brigadier: B,
  getBlockByName(name) {
    return api_blocks_ref[name];
  },
  registerParticipant(type, name, participant) {
    if (!participants[type])
      throw new Error(`unkown participant type '${type}'`);
    participants[type]?.push({ name, participant });
  },
  participants: {
    top: "top",
    generic: "generic",
  },
  context: {
    init: initContext,
    get: getCurrentContext,
    getAll: getCompleteContext,
    pop: popContext,
  },
  edit: {
    init: initEdit,
    get: getEdit,
    finish: finishEdit,
  },
  getBlock,
  getSingleLineFromTokenList,
  script: {
    evaluateCodeWithEnv,
    evaluateValueWithEnv,
  },
  get TempEnv() {
    return TempEnv;
  },
  set TempEnv(val) {
    TempEnv = val;
  },
  get tokens() {
    return tokens;
  },
  dispatch(type, command, source, reset = false) {
    return builder.execute(type, command, source, reset);
  },
  getOutputFilePath(namespace, type, name) {
    return path.resolve(
      process.cwd(),
      "data",
      namespace,
      type,
      ...namespaces,
      name
    );
  },
  getGeneratedOutputPath(namespace, type, name) {
    return path.resolve(process.cwd(), "data", namespace, type, name);
  },
  namespace: {
    push(name) {
      namespaces.push(name);
    },
    pop() {
      namespaces.pop();
    },
  },
};
function default_1(registry) {
  registry.set(".mc", (filepath) => {
    if (config.debug.logging) {
      console.time(filepath);
      console.group();
      console.time(`[Register participants]`);
      console.group();
    }
    populateCompileTimeParticipants(participants.compiler);
    builder.populateRunTimeParticipants({
      top: participants.top,
      generic: participants.generic,
    });
    if (config.debug.logging) {
      console.groupEnd();
      console.timeEnd(`[Register participants]`);
      console.time(`[Parse File '${filepath}']`);
      console.group();
    }
    const content = fs.readFileSync(filepath, "utf-8");
    const groups = HandleCompileTime(content);
    if (config.debug.logging) {
      console.groupEnd();
      console.timeEnd(`[Parse File '${filepath}']`);
    }
    api_blocks_ref = groups;
    const intermediary = path.resolve(
      process.cwd(),
      ".mcproject",
      "il",
      path.relative(SRC_DIR, filepath) + ".il"
    );
    const howManyGroupsAreThere = Object.keys(groups).length;
    const toString = () =>
      Object.entries(groups)
        .map(([key, value]) => `#${key}\n${value.join("\n")}`)
        .join("\n");
    if (config.debug.il) {
      fs.mkdirSync(path.parse(intermediary).dir, { recursive: true });
      fs.writeFileSync(intermediary, toString());
      if (config.debug.logging) Logger.log(intermediary);
    }
    log.log(`created ${howManyGroupsAreThere} group(s)`);
    builder.build({
      file: filepath,
      groups,
      target: "root",
      content: groups.root,
      pathBase: "",
      namespace: path.relative(SRC_DIR, filepath).replace(".mc", ""),
      generatedNamespace:
        path.relative(SRC_DIR, filepath).replace(".mc", "") + "_generated",
    });

    if (config.debug.logging) {
      console.timeEnd(filepath);
      console.groupEnd();
    }
  });
  return {
    exported: api,
  };
}
exports.default = default_1;

function findAndRegisterBuildInParticipants() {
  const dir = fs.readdirSync(path.resolve(__dirname, "participants"));
  dir.forEach((_path) => {
    require(path.resolve(__dirname, "participants", _path))(api);
  });
  log.log(
    `found ${dir.length} built in providers registering ${
      participants.compiler.length +
      participants.generic.length +
      participants.top.length
    } handlers`
  );
}
findAndRegisterBuildInParticipants();
builder.registerPreProcessor((cmd, { source }) =>
  runCommandAsTemplateLiteral(cmd, source)
);
