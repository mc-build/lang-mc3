import * as B from "@mc-build/brigadier";
import { BracketString } from "../args/BracketString";
import { Func, Raw,jsx } from "../jsx";
import { ILT, MCLang3File } from "../MCLang3File";
import { asyncMap } from "../util/asyncMap";
export const bind = ({
  get,
  file,
}: {
  get: (name: "top" | "generic") => B.CommandDispatcher<unknown>;
  file: MCLang3File;
}) => {
  const GenericHost = get("generic");
  let id = 0;
  const execute = GenericHost.register(B.literal("execute"));
  function dummy(template: string | any[]):any {
    // let base = _base || B.literal(template.shift());
    const item = template[0];
    if (Array.isArray(template[0])) {
      return template[0].map((item) => dummy(item));
    }
    let node: B.LiteralArgumentBuilder<unknown> | B.RequiredArgumentBuilder<unknown, unknown>;
    if (item === null) {
      //@ts-ignore
      node = B.argument(id, B.word());
    } else if (typeof item === "string") {
      node = B.literal(item);
    } else {
      //@ts-ignore
      node = B.argument(id, item);
    }
    const rest = template.slice(1);
    if (rest.length > 0) {
      let res = dummy(rest);
      if (!Array.isArray(res)) {
        res = [res];
      }
      res.forEach((item: any) => node.then(item));
    } else {
      node.redirect(execute);
    }
    return node;

    // let temp = base;
    // let tmp;
    // let fwd = true;
    // while (template.length) {
    //   let id = "arg_" + (gid++).toString(36);
    //   let item = template.shift();
    //   if (Array.isArray(item)) {
    //     item.forEach((alternatives) => {
    //       let abase = null;
    //       let _item = alternatives.shift();
    //       if (_item === null) {
    //         abase = B.argument(id, B.word());
    //       } else if (typeof _item === "string") {
    //         abase = B.literal(_item);
    //       } else {
    //         abase = B.argument(id, _item);
    //       }
    //       temp.then(dummy(alternatives, abase));
    //     });
    //     fwd = false;
    //   } else {
    //     fwd = true;
    //     if (item === null) {
    //       tmp = B.argument(id, B.word());
    //     } else if (typeof item === "string") {
    //       tmp = B.literal(item);
    //     } else {
    //       tmp = B.argument(id, item);
    //     }
    //     temp.then(tmp);
    //     temp = tmp;
    //   }
    // }
    // //   try {

    // if (fwd) temp.then(B.literal("execute").redirect(execute));
    // //   } catch (e) {}
    // return base;
  }
  function addArguments(root: B.LiteralArgumentBuilder<unknown> | Promise<any>) {
    function conditional(root: B.LiteralArgumentBuilder<unknown> | Promise<any>) {
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
    //@ts-ignore
    root.then(conditional(B.literal("if")));
    //unless
    //@ts-ignore
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
    root.then(
      dummy([
        "facing",
        [
          [null, null, null],
          ["entity", new BracketString()],
        ],
      ])
    );
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
  const c = B.literal("execute").then(
    B.literal("run").then(
      B.argument("command", B.greedyString()).executes((ctx) => {
        const cmd = ctx.getArgument("command");
        const input = ctx.getInput();
        if (cmd.startsWith("_block")) {
          const source = ctx.getSource();
          const name = cmd.split("_block").pop().trim();
          const executeCommand = input.substr(0, input.length - cmd.length - 1);
          return <Raw>
            {executeCommand}
            {" function "}
            <Func>
              {asyncMap(file.getBlock(name),(async (item:ILT)=>file.execute("generic",item,ctx.getSource())))}
            </Func>
          </Raw>
          // MCF.join(
          //   executeCommand,
          //   " function ",
          //   new MCF(
          //     source.meta.groups[cmd.substr(6)].map((cmd: any) =>
          //       api.dispatch("generic", cmd, source, true)
          //     ),
          //     source.meta.func.generated
          //   )
          // );
        } else {
          return [input];
        }
      })
    )
  );
  addArguments(c);
  GenericHost.register(c);
};
