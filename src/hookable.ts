import { serial, flatHooks } from './utils'
import { Logger } from './types'

export default class Hookable {
  private _hooks: object
  private _deprecatedHooks: object
  private _logger: Logger

  constructor (logger: Logger = console) {
    this._logger = logger
    this._hooks = {}
    this._deprecatedHooks = {}

    // Allow destructuring hook and callHook functions out of instance object
    this.hook = this.hook.bind(this)
    this.callHook = this.callHook.bind(this)
  }

  hook (name, fn) {
    if (!name || typeof fn !== 'function') {
      return
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
        this._logger.warn(
          `${originalName} hook has been deprecated` +
          (deprecatedHook.to ? `, please use ${deprecatedHook.to}` : '')
        )
      } else {
        this._logger.warn(deprecatedHook.message)
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

  removeHook (name, fn) {
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

  deprecateHook (old, name) {
    this._deprecatedHooks[old] = name
  }

  deprecateHooks (deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks)
  }

  addHooks (configHooks) {
    const hooks = flatHooks(configHooks)
    const removeFns = Object.keys(hooks).map(key => this.hook(key, hooks[key]))

    return () => {
      // Splice will ensure that all fns are called once, and free all
      // unreg functions from memory.
      removeFns.splice(0, removeFns.length).forEach(unreg => unreg())
    }
  }

  removeHooks (configHooks) {
    const hooks = flatHooks(configHooks)
    for (const key in hooks) {
      this.removeHook(key, hooks[key])
    }
  }

  async callHook (name, ...args) {
    if (!this._hooks[name]) {
      return
    }
    try {
      await serial(this._hooks[name], fn => fn(...args))
    } catch (err) {
      if (name !== 'error') {
        await this.callHook('error', err)
      }
      if (this._logger.fatal) {
        this._logger.fatal(err)
      } else {
        this._logger.error(err)
      }
    }
  }
}
