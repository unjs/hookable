import { NestedHooks, HookCallback } from './types'

export function flatHooks<T> (configHooks: NestedHooks<T>, hooks: T = {} as T, parentName?: string): T {
  for (const key in configHooks) {
    const subHook = configHooks[key]
    const name = parentName ? `${parentName}:${key}` : key
    if (typeof subHook === 'object' && subHook !== null) {
      flatHooks(subHook, hooks, name)
    } else if (typeof subHook === 'function') {
      // @ts-ignore
      hooks[name] = subHook
    }
  }
  return hooks as any
}

export function mergeHooks<T> (...hooks: NestedHooks<T>[]): T {
  const finalHooks = {} as any

  for (const hook of hooks) {
    const flatenHook = flatHooks(hook)
    for (const key in flatenHook) {
      if (finalHooks[key]) {
        finalHooks[key].push(flatenHook[key])
      } else {
        finalHooks[key] = [flatenHook[key]]
      }
    }
  }

  for (const key in finalHooks) {
    if (finalHooks[key].length > 1) {
      const arr = finalHooks[key]
      finalHooks[key] = (...args) => serial(arr, (fn: any) => fn(...args))
    } else {
      finalHooks[key] = finalHooks[key][0]
    }
  }

  return finalHooks as any
}

export function serial<T> (tasks: T[], fn: (task: T) => Promise<any> | any) {
  return tasks.reduce((promise, task) => promise.then(() => fn(task)), Promise.resolve(null))
}

export function serialCaller (hooks: HookCallback[], argv?: any[]) {
  return hooks.reduce((promise, hookFn) => promise.then(() => hookFn.apply(undefined, argv)), Promise.resolve(null))
}

export function parallerCaller (hooks: HookCallback[], argv?: any[]) {
  return Promise.all(hooks.map(hook => hook.apply(undefined, argv)))
}
