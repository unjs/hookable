import type { NestedHooks, HookCallback } from "./types";

export function flatHooks<T>(
  configHooks: NestedHooks<T>,
  hooks: T = {} as T,
  parentName?: string
): T {
  for (const key in configHooks) {
    const subHook = configHooks[key];
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
      finalHooks[key] = (...arguments_) =>
        serial(array, (function_: any) => function_(...arguments_));
    } else {
      finalHooks[key] = finalHooks[key][0];
    }
  }

  return finalHooks as any;
}

export function serial<T>(
  tasks: T[],
  function_: (task: T) => Promise<any> | any
) {
  // eslint-disable-next-line unicorn/no-array-reduce
  return tasks.reduce(
    (promise, task) => promise.then(() => function_(task)),
    Promise.resolve()
  );
}

type CreateTask = typeof console.createTask;
const defaultTask: ReturnType<CreateTask> = { run: (function_) => function_() };
const _createTask: CreateTask = () => defaultTask;
const createTask =
  typeof console.createTask !== "undefined" ? console.createTask : _createTask;

export function serialCaller(hooks: HookCallback[], arguments_?: any[]) {
  // eslint-disable-next-line unicorn/no-array-reduce
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => hookFunction(...arguments_)),
    Promise.resolve()
  );
}

export function serialTaskCaller(hooks: HookCallback[], arguments_?: any[]) {
  const name = arguments_.shift();
  const task = createTask(name);
  // eslint-disable-next-line unicorn/no-array-reduce
  return hooks.reduce(
    (promise, hookFunction) =>
      promise.then(() => task.run(() => hookFunction(...arguments_))),
    Promise.resolve()
  );
}

export function parallelCaller(hooks: HookCallback[], arguments_?: any[]) {
  return Promise.all(hooks.map((hook) => hook(...arguments_)));
}

export function parallelTaskCaller(hooks: HookCallback[], arguments_?: any[]) {
  const name = arguments_.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...arguments_))));
}

export function callEachWith(
  callbacks: Array<(argument0: any) => any>,
  argument0?: any
) {
  for (const callback of callbacks) {
    callback(argument0);
  }
}
