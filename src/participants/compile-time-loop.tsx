import { CompileTimeError, ErrorType } from "../CompileTimeError";

import * as B from "@mc-build/brigadier";
import { MCLang3File } from "../MCLang3File";
import { ScriptableLanguage } from "../ScriptableLanguage";
import { ScriptArgument } from "../args/ScriptArgument";
import { BlockArgument } from "../args/BlockArgument";
export const bind = ({
  get,
  file,
}: {
  get: (name: "top" | "generic") => B.CommandDispatcher<unknown>;
  file: MCLang3File;
}) => {
  const Loop = (target: "top" | "generic") =>
    B.literal("LOOP").then(
      B.argument("var_name", B.string())
        .then(
          B.literal("value").then(
            B.argument("count", B.string()).then(
              //@ts-ignore-next-line
              B.argument(
                "block",
                new BlockArgument(file, false, false)
              ).executes(async (ctx: B.CommandContext<any>) => {
                debugger;
                const source = ctx.getSource();
                let min = 0;
                let max = ctx.getArgument("count");
                let value = max;
                if (max.includes("..")) {
                  [min, max] = max.split("..").map((_: any) => parseInt(_));
                }
                if (min >= max) {
                  throw new CompileTimeError(
                    ErrorType.CUSTOM,
                    `Invalid loop value(s) (${value})`
                  );
                }
                const var_name = ctx.getArgument("var_name");
                const { block } = ctx.getArgument("block");
                const result = [];
                let i;
                for (i = min; i < max; i++) {
                  for (let command of block) {
                    result.push(
                      await file.execute(target, command, {
                        ...source,
                        env:{
                          ...source.env,
                          [var_name]: i,
                        }
                      },(v)=>result.push(v))
                    );
                  }
                }

                return result;
              })
            )
          )
        )
        .then(
          B.literal("script").then(
            B.argument("value", new ScriptArgument(false)).then(
              //@ts-ignore-next-line
              B.argument("block", new BlockArgument(file,false,false)).executes(
                async (ctx: B.CommandContext<any>) => {
                  const source = ctx.getSource();
                  const in_value = await ScriptableLanguage.evaluateCode(
                    `return ${ctx.getArgument("value").script}`,
                    source.env,
                    null
                  );
                  const var_name = ctx.getArgument("var_name");
                  const { block } = ctx.getArgument("block");
                  const result = [];
                  if (Array.isArray(in_value)) {
                    for (const item of in_value) {
                      for (let command of block) {
                        result.push(
                          await file.execute(target, command, {
                            //@ts-ignore-next-line
                            ...source,
                            env:{
                              ...source.env,
                              [var_name]: item,
                            }
                          },(i)=>result.push(i))
                        );
                      }
                    }
                  } else if (typeof in_value === "object") {
                    for (const key in in_value) {
                      const value = in_value[key];
                      for (let command of block) {
                        result.push(
                          await file.execute("generic", command, {
                            ...source,
                            env:{
                              ...source.env,
                              [var_name]: { key, value },
                            }
                          },(i)=>result.push(i))
                        );
                      }
                    }
                  }

                  return result;
                }
              )
            )
          )
        )
    );
  get("generic").register(Loop("generic"));
  get("top").register(Loop("top"));
};
