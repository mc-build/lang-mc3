const crypto = require("crypto");
const File = require("!io/File");
const path = require("path");
class Compound {
  constructor(...items) {
    this.items = items;
    this.rendered = null;
  }
  render(willExport) {
    if (this.rendered != null) return this.rendered;
    this.rendered = this.items
      .map((item) => {
        if (item instanceof Compound) {
          return item.render();
        }
        if (item instanceof MCF) {
          return item.getCallSignature();
        }
        return item;
      })
      .join("");
    return this.rendered;
  }
}
class MCF {
  static recursiveId = 0;
  static all = [];
  static exports = new Map();
  static reset() {
    MCF.recursiveId = 0;
    MCF.all = [];
    MCF.exports = new Map();
  }
  static join(...args) {
    return new Compound(...args);
  }
  constructor(data, pathMeta, path = null) {
    this.pathMeta = pathMeta;
    MCF.all.push(this);
    this._generated = path === null;
    this._hash = null;
    this._result = null;
    if (Array.isArray(data)) {
      this.commands = data;
      this.prefix = [];
      this.suffix = [];
      if (path === null) {
        this.path = this.hash();
      } else {
        this.path = path;
      }
    } else if (typeof data === "object") {
      this.commands = [];
      this.prefix = data.prefix ?? [];
      this.suffix = data.suffix ?? [];
    } else {
      throw new Error("Invalid MCF configuration");
    }
  }
  hash() {
    if (this._hash != null) return this._hash;
    if (MCF.exports.has(this)) return MCF.exports.get(this);
    MCF.exports.set(this, `[recursive function ${MCF.recursiveId++}]`);
    const code = this.render();
    this._hash = crypto.createHash("md5").update(code).digest("hex");
    MCF.exports.set(this, this._hash);
    return this._hash;
  }
  getCallSignature() {
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
