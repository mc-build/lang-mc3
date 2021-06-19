import * as B from "@mc-build/brigadier";
import { ScriptArgument } from "../args/ScriptArgument";
import { BlockArgument } from "../args/BlockArgument";
import { MCLang3File } from "../MCLang3File";
import { ScriptableLanguage } from "../ScriptableLanguage";
import { asyncMap } from "../util/asyncMap";
export const bind = ({
  get,
  file,
}: {
  get: (name: "top" | "generic") => B.CommandDispatcher<unknown>;
  file: MCLang3File;
}) => {
  const Host = get("generic");
  const compileTimeIfStatement = async (ctx: {
    getArgument: (arg0: string) => {
      (): any;
      new (): any;
      getHistory: { (): any; new (): any };
    };
    getSource: () => any;
  }) => {
    const source = ctx.getSource();
    let h2;
    try {
      h2 = ctx.getArgument("block2")?.getHistory();
    } catch (e) {}
    const block = [...ctx.getArgument("block").getHistory(), ...(h2 || [])];
    const conditions = ctx.getArgument("script").getHistory();
    for (let i = 0; i < block.length; i++) {
      if (
        i >= conditions.length ||
        await ScriptableLanguage.evaluateCode(`return ${conditions[i].script}`, source.env)
      ) {
        return await asyncMap(block[i].block,async (command: any) => {
          let res = await file.execute("generic", command, source);
          return res || command.value;
        });
      }
    }
    return [];
  };
  const IF = Host.register(B.literal("IF"));
  Host.register(
    B.literal("IF").then(
      B.argument("script", new ScriptArgument()).then(
        B.argument("block", new BlockArgument(file))
          .executes(compileTimeIfStatement)
          .then(
            B.literal("ELSE")
              .then(
                B.literal("_block").then(
                  B.argument("block2", new BlockArgument(file, true)).executes(
                    compileTimeIfStatement
                  )
                )
              )
              //@ts-ignore-next-line
              .then(B.literal("IF").forward(IF))
          )
      )
    )
  );
};
