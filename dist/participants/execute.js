const B = require("@jsprismarine/brigadier");
const File = require("!io/File");
const MCF = require("../Function");
const { BlockArgument } = require("../BlockArgument");
const { BracketString } = require("../BracketString");
module.exports = (api) => {
  api.registerParticipant(api.participants.generic, "execute", (Host) => {
    const execute = Host.register(B.literal("execute"));
    let gid = 0;
    function dummy(template, _base) {
      let base = _base || B.literal(template.shift());
      let temp = base;
      let tmp;
      let fwd = true;
      while (template.length) {
        let id = "arg_" + (gid++).toString(36);
        let item = template.shift();
        if (Array.isArray(item)) {
          item.forEach((alternatives) => {
            let abase = null;
            let _item = alternatives.shift();
            if (_item === null) {
              abase = B.argument(id, B.word());
            } else if (typeof _item === "string") {
              abase = B.literal(_item);
            } else {
              abase = B.argument(id, _item);
            }
            temp.then(dummy(alternatives, abase));
          });
          fwd = false;
        } else {
          fwd = true;
          if (item === null) {
            tmp = B.argument(id, B.word());
          } else if (typeof item === "string") {
            tmp = B.literal(item);
          } else {
            tmp = B.argument(id, item);
          }
          temp.then(tmp);
          temp = tmp;
        }
      }
      //   try {

      if (fwd) temp.redirect(execute);
      //   } catch (e) {}
      return base;
    }
    function addArguments(root) {
      function conditional(root) {
        //block
        root.then(dummy(["block", null, null, null, new BracketString()]));
        //blocks
        root.then(
          dummy([
            "blocks",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ])
        );
        //data
        root.then(
          dummy(["data", "block", null, null, null, new BracketString()])
        );
        root.then(
          dummy(["data", "entity", new BracketString(), new BracketString()])
        );
        root.then(dummy(["data", "storage", null, new BracketString()]));
        //entity
        root.then(dummy(["entity", new BracketString()]));
        //predicate
        root.then(dummy(["predicate", null]));
        //score
        root.then(dummy(["score", new BracketString(), null, "matches", null]));
        for (let op of ["<", "<=", "=", ">=", ">"]) {
          root.then(
            dummy([
              "score",
              new BracketString(),
              null,
              op,
              new BracketString(),
              null,
            ])
          );
        }
        return root;
      }
      //if
      root.then(conditional(B.literal("if")));
      //unless
      root.then(conditional(B.literal("unless")));
      //align
      root.then(dummy(["align", null]));
      //anchored
      root.then(dummy(["anchored", null]));
      //as
      root.then(dummy(["as", new BracketString()]));
      //at
      root.then(dummy(["at", new BracketString()]));
      //facing
      root.then(dummy(["facing", null, null, null]));
      root.then(dummy(["facing", "entity", new BracketString()]));
      //in
      root.then(dummy(["in", null]));
      //positioned
      root.then(dummy(["positioned", null, null, null]));
      //rotated
      root.then(
        dummy([
          "rotated",
          [
            [null, null],
            ["as", new BracketString()],
          ],
        ])
      );
      //store
      return root;
    }
    Host.register(
      addArguments(
        B.literal("execute").then(
          B.literal("run").then(
            B.argument("command", B.greedyString()).executes((ctx) => {
              console.log(ctx.getArgument("command"));
            })
          )
        )
      )
    );
    console.log(Host);
  });
};
