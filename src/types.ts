export type HookCallback = (...args: any) => Promise<void> | void
export interface Hooks { [key: string]: HookCallback }
export type HookKeys<T> = keyof T & string
export type NestedHooks<T> = Partial<{ [name in HookKeys<T>]: NestedHooks<T> | HookCallback }>
export type DeprecatedHook<T> = string | { message?: string, to: HookKeys<T> }
export type DeprecatedHooks<T> = { [name in HookKeys<T>]: DeprecatedHook<T> }
