// @ts-ignore
import {File} from "!io";
import path from "path";
import { MCLang3File } from "./MCLang3File";
let gid = 0;
let seen:Set<string>,ns_data:{ namespace: string | undefined; base: string[]; },directory_stack:string[],file_path:string;
function findNamespaceFromFilepath(fp:string){
  const segments = fp.replace(/\..+$/,"").split(path.sep);
  segments.splice(0,segments.lastIndexOf("src")+1);
  const ns = segments.shift();
  return{namespace:ns,base:[...segments.slice(1)]};
}
let func_stack: any[] = [];
export function reset_builder(host:MCLang3File){
  seen = new Set();
  ns_data = findNamespaceFromFilepath(host.file_path);
  directory_stack = [];
  func_stack = [];
  gid = 0;
  file_path = host.file_path;
} 
export function builder(item: any) {
  if(typeof item === "string")return item;
  const children = item.children.flat(Infinity);
  const attributes = item.attributes || {};
  switch (item.type) {
    default:
      debugger;
      break;
    case "ref":
      let {name,generated} = item.target.attributes;
      let _name = name || (gid++).toString();
      if(!name){
        attributes.generated = true;
        generated = true;
      }
      attributes.name = _name;
      const complete = [...ns_data.base,generated?"generated":null,...directory_stack,_name].filter(Boolean).join("/");
      return `${ns_data.namespace}:${complete}`;
    case "func": {
      let {name,generated} = attributes;
      const f = new File();
      let _name = name || (gid++).toString();
      attributes.name = _name;
      if(!name){
        attributes.generated = true;
        generated = true;
      }
      const complete = [...ns_data.base,generated?"generated":null,...directory_stack,_name].filter(Boolean).join("/");
      func_stack.push(`${ns_data.namespace}:${complete}`);
      f.setPath(path.resolve(process.cwd(), `data/${ns_data.namespace}/functions/${complete}.mcfunction`));
      f.setContents(children.map(builder).join("\n").replace(/(<\.+>)/,(match:string)=>{
        const size = match.length-2;
        return func_stack[func_stack.length-size];
      }));
      f.confirm(file_path);
      func_stack.pop();
      return `${ns_data.namespace}:${complete}`;
    }
    case "dir":{
      directory_stack.push(item.attributes.name);
      children.forEach((item:any) => {
        builder(item);
      });
      directory_stack.pop();
    }
    case "raw": {
      return children.map(builder).join("");
    }
  }
}