import type { NestedHooks, HookCallback } from "./types";

export function flatHooks<T>(
  configHooks: NestedHooks<T>,
  hooks: T = {} as T,
  parentName?: string,
): T {
  for (const key in configHooks) {
    // @ts-ignore
    const subHook: T = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      // @ts-ignore
      hooks[name] = subHook;
    }
  }
  return hooks as any;
}

export function mergeHooks<T>(...hooks: NestedHooks<T>[]): T {
  const finalHooks = {} as any;

  for (const hook of hooks) {
    const flatenHook = flatHooks(hook);
    for (const key in flatenHook) {
      if (finalHooks[key]) {
        finalHooks[key].push(flatenHook[key]);
      } else {
        finalHooks[key] = [flatenHook[key]];
      }
    }
  }

  for (const key in finalHooks) {
    if (finalHooks[key].length > 1) {
      const array = finalHooks[key];
      finalHooks[key] = (...arguments_: any[]) =>
        serial(array, (function_: any) => function_(...arguments_));
    } else {
      finalHooks[key] = finalHooks[key][0];
    }
  }

  return finalHooks as any;
}

export function serial<T>(
  tasks: T[],
  function_: (task: T) => Promise<any> | any,
) {
  // eslint-disable-next-line unicorn/no-array-reduce
  return tasks.reduce(
    (promise, task) => promise.then(() => function_(task)),
    Promise.resolve(),
  );
}

// https://developer.chrome.com/blog/devtools-modern-web-debugging/#linked-stack-traces
type CreateTask = typeof console.createTask;
const defaultTask: ReturnType<CreateTask> = { run: (function_) => function_() };
const _createTask: CreateTask = () => defaultTask;
const createTask =
  console.createTask === undefined ? _createTask : console.createTask;

export function serialTaskCaller(hooks: HookCallback[], args: any[]) {
  const name = args.shift();
  const task = createTask(name);
  // eslint-disable-next-line unicorn/no-array-reduce
  return hooks.reduce(
    (promise, hookFunction) =>
      promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve(),
  );
}

export function parallelTaskCaller(hooks: HookCallback[], args: any[]) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}

/** @deprecated */
export function serialCaller(hooks: HookCallback[], arguments_?: any[]) {
  // eslint-disable-next-line unicorn/no-array-reduce
  return hooks.reduce(
    (promise, hookFunction) =>
      promise.then(() => hookFunction(...(arguments_ || []))),
    Promise.resolve(),
  );
}

/** @deprecated */
export function parallelCaller(hooks: HookCallback[], args?: any[]) {
  return Promise.all(hooks.map((hook) => hook(...(args || []))));
}

export function callEachWith(callbacks: Array<(arg0: any) => any>, arg0?: any) {
  // eslint-disable-next-line unicorn/no-useless-spread
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}
