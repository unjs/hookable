const { serial, flatHooks } = require('./utils')

module.exports = class Hookable {
  constructor (logger = console) {
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

    if (this._deprecatedHooks[name]) {
      if (process.env.NODE_ENV !== 'production') {
        this._logger.warn(`${name} hook has been deprecated, please use ${this._deprecatedHooks[name]}`)
      }
      name = this._deprecatedHooks[name]
    }

    this._hooks[name] = this._hooks[name] || []
    this._hooks[name].push(fn)
  }

  deprecateHook (old, name) {
    this._deprecatedHooks[old] = name
  }

  deprecateHooks (deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks)
  }

  addHooks (configHooks) {
    const hooks = flatHooks(configHooks)
    for (const key in hooks) {
      this.hook(key, hooks[key])
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

  clearHook (name) {
    if (name) {
      delete this._hooks[name]
    }
  }

  clearHooks () {
    this._hooks = {}
  }
}
