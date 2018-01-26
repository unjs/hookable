import { serial, parallel } from 'items-promise'

export default class Hookable {
  constructor() {
    this.$hooks = {}
    this.hook = this.hook.bind(this)
  }

  async callHook(name, ...args) {
    if (!this.$hooks[name]) {
      return
    }
    await serial(this.$hooks[name], fn => fn(...args))
  }

  async callHookAsync(name, ...args) {
    if (!this.$hooks[name]) {
      return
    }
    await parallel(this.$hooks[name], fn => fn(...args))
  }

  hook(name, fn) {
    if (Array.isArray(fn)) {
      for (let f of fn) {
        this.hook(name, fn)
      }
      return
    }

    if (!name || typeof fn !== 'function') {
      return
    }

    this.$hooks[name] = this.$hooks[name] || []
    this.$hooks[name].push(fn)
  }

  hookObj(hooksObj) {
    for (let name of Object.keys(hooksObj)) {
      this.hook(name, hooksObj[name])
    }
  }
}
