import { serial, parallel } from 'items-promise'

export default class Hookable {
  constructor() {
    this.$hooks = {}

    this.hook = this.hook.bind(this)
    this.hookObj = this.hookObj.bind(this)
  }

  callHook(name, ...args) {
    if (!this.$hooks[name]) {
      return
    }
    return serial(this.$hooks[name], fn => fn.apply(fn, args))
  }

  callHookAsync(name, ...args) {
    if (!this.$hooks[name]) {
      return
    }
    return parallel(this.$hooks[name], fn => fn.apply(fn, args))
  }

  hook(name, fn) {
    if (!name || typeof fn !== 'function') {
      return
    }

    if (!this.$hooks[name]) {
      this.$hooks[name] = []
    }

    if (Array.isArray(fn)) {
      Array.prototype.push.apply(this.$hooks[name], fn)
    } else {
      this.$hooks[name].push(fn)
    }
  }

  hookObj(hooksObj) {
    for (let name in hooksObj) {
      this.hook(name, hooksObj[name])
    }
  }
}
