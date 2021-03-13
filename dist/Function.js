const crypto = require("crypto");
const File = require("!io/File");
const path = require("path");
const config = require("!config/mc");
const persistent = require("!persistent");
class CommandInsert {
  constructor(name) {
    this.name = name;
  }
  get(lookup, pathMeta) {
    let res = lookup[this.name];
    if (Array.isArray(res)) {
      return res.map((cmd) => MCF._evaluate(cmd, lookup));
    } else if (res instanceof Compound) {
      return res.render(true, pathMeta, lookup);
    } else if (res instanceof MCF) {
      return res.getCallSignature();
    }
    return res;
  }
}
class Compound {
  constructor(...items) {
    this.items = items;
    this.rendered = null;
  }
  render(willExport, pathMeta, inserts) {
    if (this.rendered != null) return this.rendered;
    this.rendered = this.items
      .map((item) => {
        if (item instanceof CommandInsert) {
          return item.get(inserts, pathMeta);
        } else if (item instanceof Compound) {
          return item.render(true, pathMeta, inserts);
        }
        if (item instanceof MCF) {
          return item.getCallSignature(pathMeta, inserts);
        }
        return item;
      })
      .join("");
    return this.rendered;
  }
}
class MCF {
  static ids = persistent.get("mclang-3_ids") || [];
  static lastIds = [];
  static getId(hash) {
    let index = MCF.ids.indexOf(hash);
    let old_index = MCF.lastIds.indexOf(hash);
    if (old_index > -1) {
      MCF.ids[old_index] = hash;
      index = old_index;
    } else if (old_index == -1 && index == -1) {
      index = MCF.ids.length;
      for (let i = 0; i < MCF.lastIds.length; i++) {
        if (!MCF.lastIds[i]) {
          MCF.ids[i] = hash;
          return String(i);
        }
      }
      MCF.ids.push(hash);
    }
    return String(index);
  }
  static renderStack = [];
  static Templates = {};
  static recursiveId = 0;
  static all = [];
  static exports = new Map();
  static getTop(depth = 1) {
    return MCF.renderStack[MCF.renderStack.length - depth].getCallSignature();
  }
  static reset() {
    MCF.recursiveId = 0;
    MCF.all = [];
    MCF.lastIds = MCF.ids;
    MCF.ids = [];
    persistent.set("mclang-3_ids", MCF.ids);
    MCF.exports = new Map();
  }
  static join(...args) {
    return new Compound(...args);
  }
  static _evaluate(command, inserts, pathMeta) {
    if (command instanceof CommandInsert) {
      return command.get(inserts, pathMeta);
    } else if (command instanceof Compound) {
      return command.render(true, pathMeta, inserts);
    } else if (command instanceof MCF) {
      return command.getCallSignature(pathMeta, inserts);
    }
  }
  static template(name) {
    return new CommandInsert(name);
  }
  constructor(data, pathMeta, path = null) {
    this.pathMeta = pathMeta;
    this.locked = false;
    this.isTemplate = false;
    this.id = Math.random().toString(16).substr(2);
    MCF.all.push(this);
    this._generated = path === null;
    this._hash = null;
    this._result = null;
    if (Array.isArray(data)) {
      this.commands = data;
      this.prefix = [];
      this.suffix = [];
      if (path === null) {
        this.path = null;
      } else {
        this.path = path;
      }
    } else if (typeof data === "object") {
      this.commands = data.commands ?? [];
      this.prefix = data.prefix ?? [];
      this.suffix = data.suffix ?? [];
      this.isTemplate = true;
      MCF.Templates[this.id] = this;
    } else {
      throw new Error("Invalid MCF configuration");
    }
  }
  fork(pathMeta, inserts = {}) {
    if (this.isTemplate) {
      return new MCF(
        [...this.prefix, ...this.commands, ...this.suffix].map((value) =>
          MCF._evaluate(value, inserts, pathMeta)
        ),
        pathMeta
      );
    } else {
      throw new Error("unable to fork function as its not a template");
    }
  }
  addCommands(...commands) {
    if (this.locked) {
      throw new Error(
        "unable to add commands to function as its already been rendered"
      );
    } else {
      this.commands.push(commands);
    }
  }
  hash() {
    if (this._hash != null) return this._hash;
    this.locked = true;
    if (MCF.exports.has(this)) return MCF.exports.get(this);
    MCF.exports.set(this, `[recursive function ${MCF.recursiveId++}]`);
    const code = this.render();
    this._hash = MCF.getId(crypto.createHash("md5").update(code).digest("hex"));
    MCF.exports.set(this, this._hash);
    this._result = this._result.replace(/\$block/g, this.getCallSignature());
    this._result = this._result.replace(/\$parent/g, MCF.getTop(1));
    return this._hash;
  }
  getCallSignature(forkPathMeta, forkInserts) {
    if (this.isTemplate) {
      return this.fork(forkPathMeta, forkInserts);
    }
    return (
      this.pathMeta.namespace +
      ":" +
      [...this.pathMeta.dir, !this._generated ? this.path : this.hash()].join(
        "/"
      )
    );
  }
  render() {
    if (this._result != null) return this._result;
    MCF.renderStack.push(this);
    let tmp = [...this.prefix, ...this.commands, ...this.suffix]
      .flat(Infinity)
      .map((_) => {
        if (_ instanceof Compound) {
          return _.render();
        } else if (_ instanceof MCF) {
          return `function ${item.getCallSignature()}`;
        } else {
          return String(_);
        }
      })
      .join("\n");
    if (this._hash || this.path) {
      tmp = tmp.replace(/\$block/g, this.getCallSignature());
    }
    if (this._hash) {
      tmp = tmp.replace(/\$parent/g, MCF.getTop(2));
    }
    MCF.renderStack.pop();
    if (!MCF.exports.has(this)) return tmp;
    return (this._result = tmp);
  }
  toFile() {
    const f = new File();
    f.setContents(this.render(true));
    const [namespace, loc] = this.getCallSignature().split(":");
    f.setPath(
      path.resolve("data", namespace, "functions", loc + ".mcfunction")
    );
    return f;
  }
}

module.exports = MCF;
// const inner = new MCF({ commands: ["say hi"] });
// inner.addCommands(MCF.join("function ", inner));
// const test = new MCF({
//   prefix: [
//     MCF.join("say ", MCF.template("message")),
//     MCF.join("function ", inner),
//   ],
// });

// test.fork({ dir: [], namespace: "generated" }, { message: "test" });
