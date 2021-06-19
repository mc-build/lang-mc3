export namespace JSX {
  interface ElementClass {
    render: any;
  }
}

type IProps = {
  ref: IRef;
} | null;
interface INode {
  type: string;
  props: IProps;
  children?: Child | Child[];
}
interface IRef {
  type:"ref";
  isRef: true;
  target: INode | null;
  children:[]
}
export function ref(): IRef {
  return {
    type:"ref",
    isRef: true,
    target: null,
    children:[]
  };
}
type Child = INode | string;
export async function jsx(
  name: string | Function,
  props: IProps,
  ...children: Child[]
) {
  let res = {
    type: name,
    attributes: props,
    children: await Promise.all(children.flat(Infinity)),
  };
  if (typeof res.type === "function") {
    res = await res.type({ ...props, children: res.children });
  }
  if (props?.ref) {
    //@ts-ignore
    props.ref.target = res;
  }
  return res;
}
export const Raw = "raw";
export const Func = "func";
export const Dir = "dir";
export async function Command({
  children,
}: {
  children: string | Promise<string> | (string | Promise<string>)[];
}) {
  return Promise.all(Array.isArray(children) ? children : [children]).then(
    (res) => res.join("")
  );
}
