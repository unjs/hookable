export type HookCallback = (...args: any) => Promise<void> | void
export interface Hooks { [key: string]: HookCallback }
export type HookKeys<T> = keyof T & string
export type DeprecatedHook<T> = string | { message?: string, to: HookKeys<T> }
export type DeprecatedHooks<T> = { [name in HookKeys<T>]: DeprecatedHook<T> }

// Utilities
type ValueOf<C> = C extends Record<any, any> ? C[keyof C] : never
type Strings<T> = Exclude<keyof T, number | symbol>

// Unwrapping utilities
type Namespaces<T> = ValueOf<{
  [key in Strings<T>]: key extends `${infer Namespace}:${string}` ? Namespace : never
}>
type BareHooks<T> = ValueOf<{
  [key in Strings<T>]: key extends `${string}:${string}` ? never : key
}>
type HooksInNamespace<T, Namespace extends string> = ValueOf<{
  [key in Strings<T>]: key extends `${Namespace}:${infer HookName}` ? HookName : never
}>
type WithoutNamespace<T, Namespace extends string> = {
  [key in HooksInNamespace<T, Namespace>]: `${Namespace}:${key}` extends keyof T ? T[`${Namespace}:${key}`] : never
}
export type NestedHooks<T> = Partial<T> & Partial<{
  [key in Namespaces<T>]: NestedHooks<WithoutNamespace<T, key>>
}> & Partial<{
  [key in BareHooks<T>]: T[key]
}>
