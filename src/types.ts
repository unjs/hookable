export type unregHookT = () => void
export type hookFnT = (...args: any) => Promise<void> | void
export type configHooksT = { [name: string]: configHooksT | hookFnT | hookFnT[] }
export type deprecatedHookT = string | { message: string, to: string }
export type deprecatedHooksT = { [name: string]: deprecatedHookT}
export type flatHooksT = { [name: string]: hookFnT|hookFnT[] }

export interface LoggerT {
  error(...args: any): void,
  fatal?(...args: any): void,
  warn(...args: any): void
}
