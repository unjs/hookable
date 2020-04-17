import { configHooksT, flatHooksT } from './types'

export function flatHooks (configHooks: configHooksT, hooks: flatHooksT = {}, parentName?: string): flatHooksT {
  for (const key in configHooks) {
    const subHook = configHooks[key]
    const name = parentName ? `${parentName}:${key}` : key
    if (typeof subHook === 'object' && subHook !== null) {
      flatHooks(subHook, hooks, name)
    } else {
      hooks[name] = subHook
    }
  }
  return hooks
}

export function serial<T> (tasks: T[], fn: (task: T) => Promise<any> | any) {
  return tasks.reduce((promise, task) => promise.then(() => fn(task)), Promise.resolve(null))
}
