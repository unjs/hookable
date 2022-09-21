import type { NestedHooks, HookCallback, CreateDebuggerOptions } from './types'
import type { Hookable } from '.'

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

export function serialCaller (hooks: HookCallback[], args?: any[]) {
  return hooks.reduce((promise, hookFn) => promise.then(() => hookFn.apply(undefined, args)), Promise.resolve(null))
}

export function parallelCaller (hooks: HookCallback[], args?: any[]) {
  return Promise.all(hooks.map(hook => hook.apply(undefined, args)))
}

export function callEachWith (callbacks: Function[], arg0?: any) {
  for (const cb of callbacks) {
    cb(arg0)
  }
}

const isBrowser = typeof navigator !== 'undefined'

/** Start debugging hook names and timing in console */
export function createDebugger (hooks: Hookable, { tag, inspect = isBrowser, group = isBrowser, filter: _filter = () => true }: CreateDebuggerOptions = {}) {
  const wrapName = tag ? (event: string) => `[${tag}] ${event}` : (event: string) => event

  const filter = typeof _filter === 'string' ? (name: string) => name.startsWith(_filter) : _filter

  const unsubscribeBefore = hooks.beforeEach(({ name }) => {
    if (!filter(name)) { return }

    console.time(wrapName(name))
  })

  const unsubscribeAfter = hooks.afterEach(({ name, args }) => {
    if (!filter(name)) { return }

    if (group) { console.groupCollapsed(name) }

    if (inspect) {
      console.timeLog(wrapName(name), args)
    } else {
      console.timeEnd(wrapName(name))
    }

    if (group) { console.groupEnd() }
  })

  return {
    /** Stop debugging and remove listeners */
    close: () => {
      unsubscribeBefore()
      unsubscribeAfter()
    }
  }
}
