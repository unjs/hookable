import { serial, flatHooks } from './utils'
import type { DeprecatedHook, NestedHooks, HookCallback, HookKeys } from './types'
export * from './types'

export class Hookable <
  HooksT = Record<string, HookCallback>,
  HookNameT extends HookKeys<HooksT> = HookKeys<HooksT>
> {
  private _hooks: { [key: string]: HookCallback[] }
  private _deprecatedHooks: Record<string, DeprecatedHook<HooksT>>

  constructor () {
    this._hooks = {}
    this._deprecatedHooks = {}

    // Allow destructuring hook and callHook functions out of instance object
    this.hook = this.hook.bind(this)
    this.callHook = this.callHook.bind(this)
  }

  hook <NameT extends HookNameT> (name: NameT, fn: HooksT[NameT] & HookCallback) {
    if (!name || typeof fn !== 'function') {
      return () => {}
    }

    const originalName = name
    let deprecatedHook
    while (this._deprecatedHooks[name]) {
      deprecatedHook = this._deprecatedHooks[name]
      if (typeof deprecatedHook === 'string') {
        deprecatedHook = { to: deprecatedHook }
      }
      name = deprecatedHook.to
    }
    if (deprecatedHook) {
      if (!deprecatedHook.message) {
        console.warn(
          `${originalName} hook has been deprecated` +
          (deprecatedHook.to ? `, please use ${deprecatedHook.to}` : '')
        )
      } else {
        console.warn(deprecatedHook.message)
      }
    }

    this._hooks[name] = this._hooks[name] || []
    this._hooks[name].push(fn)

    return () => {
      if (fn) {
        this.removeHook(name, fn)
        fn = null // Free memory
      }
    }
  }

  hookOnce <NameT extends HookNameT> (name: NameT, fn: HooksT[NameT] & HookCallback) {
    let _unreg
    let _fn = (...args) => {
      _unreg()
      _unreg = null
      _fn = null
      return fn(...args)
    }
    _unreg = this.hook(name, _fn as typeof fn)
    return _unreg
  }

  removeHook <NameT extends HookNameT> (name: NameT, fn: HooksT[NameT] & HookCallback) {
    if (this._hooks[name]) {
      const idx = this._hooks[name].indexOf(fn)

      if (idx !== -1) {
        this._hooks[name].splice(idx, 1)
      }

      if (this._hooks[name].length === 0) {
        delete this._hooks[name]
      }
    }
  }

  deprecateHook <NameT extends HookNameT> (name: NameT, deprecated: DeprecatedHook<HooksT>) {
    this._deprecatedHooks[name] = deprecated
  }

  deprecateHooks (deprecatedHooks: Record<HookNameT, DeprecatedHook<HooksT>>) {
    Object.assign(this._deprecatedHooks, deprecatedHooks)
  }

  addHooks (configHooks: NestedHooks<HooksT>) {
    const hooks = flatHooks<HooksT>(configHooks)
    // @ts-ignore
    const removeFns = Object.keys(hooks).map(key => this.hook(key, hooks[key]))

    return () => {
      // Splice will ensure that all fns are called once, and free all
      // unreg functions from memory.
      removeFns.splice(0, removeFns.length).forEach(unreg => unreg())
    }
  }

  removeHooks (configHooks: NestedHooks<HooksT>) {
    const hooks = flatHooks<HooksT>(configHooks)
    for (const key in hooks) {
      // @ts-ignore
      this.removeHook(key, hooks[key])
    }
  }

  // @ts-ignore HooksT[NameT] & HookCallback prevents typechecking
  callHook <NameT extends HookNameT> (name: NameT, ...args: Parameters<HooksT[NameT]>) {
    if (!this._hooks[name]) {
      return
    }
    return serial(this._hooks[name], fn => fn(...args))
  }
}

export function createHooks<T> (): Hookable<T> {
  return new Hookable<T>()
}
