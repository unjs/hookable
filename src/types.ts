export type unregHook = () => {}
export type hookFn = (...args: any) => Promise<void> | void

export interface Logger {
  error(...args: any),
  fatal?(...args: any),
  warn?(...args: any)
}
