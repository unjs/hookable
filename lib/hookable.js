const { serial } = require('items-promise')
const consola = require('consola')
const { flatHooks } = require('./utils')

module.exports = class Hookable {
  constructor () {
    this._hooks = {}
    this._deprecatedHooks = {}

    this.hook = this.hook.bind(this)
    this.callHook = this.callHook.bind(this)
  }

  hook (name, fn) {
    if (!name || typeof fn !== 'function') {
      return
    }

    if (this._deprecatedHooks[name]) {
      consola.warn(`${name} hook has been deprecated, please use ${this._deprecatedHooks[name]}`)
      name = this._deprecatedHooks[name]
    }

    this._hooks[name] = this._hooks[name] || []
    this._hooks[name].push(fn)
  }

  deprecateHook (old, name) {
    this._deprecatedHooks[old] = name
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
      name !== 'error' && await this.callHook('error', err)
      consola.error(err)
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
