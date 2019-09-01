export function flatHooks (configHooks, hooks = {}, parentName) {
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

export function serial (tasks, fn) {
  return tasks.reduce((promise, task) => promise.then(previous => fn(task, previous)), Promise.resolve(null))
}
