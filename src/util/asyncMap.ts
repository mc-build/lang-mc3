const USE_ASYNC = false;
export async function asyncMap(arr: any[], fn: Function) {
  let next: any[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (USE_ASYNC) next.push(await fn(arr[i], i, arr));
    else next.push(fn(arr[i], i, arr));
  }
  return next;
}
