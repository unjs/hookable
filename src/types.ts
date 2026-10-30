export type HookCallback = (...arguments_: any) => Promise<void> | void;
export interface Hooks {
  [key: string]: HookCallback;
}
export type HookKeys<T> = keyof T & string;
export type DeprecatedHook<T> = { message?: string; to: HookKeys<T> };
export type DeprecatedHooks<T> = { [name in HookKeys<T>]: DeprecatedHook<T> };

export type HookListenerEvent<HT extends Record<string, any> = Record<string, HookCallback>> = {
  [key in keyof HT]: {
    /** Hook name */
    name: key;
    args: Parameters<HT[key]>;
    /** `label` passed to `hook()`, or the listener function name */
    label: string;
    fn: HookCallback;
    /** Shared with the `beforeEach` / `afterEach` event of the same call */
    context: Record<string, any>;
    /** Listener execution time in ms (only in `afterEachListener`) */
    duration?: number;
    /** Thrown or rejected value (only in `afterEachListener`) */
    error?: unknown;
  };
}[keyof HT];

// Utilities
type ValueOf<C> = C extends Record<any, any> ? C[keyof C] : never;
type Strings<T> = Exclude<keyof T, number | symbol>;
type KnownKeys<T> = keyof {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: never;
};
type StripGeneric<T> = Pick<T, KnownKeys<T> extends keyof T ? KnownKeys<T> : never>;
type OnlyGeneric<T> = Omit<T, KnownKeys<T> extends keyof T ? KnownKeys<T> : never>;

// Unwrapping utilities
type Namespaces<T> = ValueOf<{
  [key in Strings<T>]: key extends `${infer Namespace}:${string}` ? Namespace : never;
}>;
type BareHooks<T> = ValueOf<{
  [key in Strings<T>]: key extends `${string}:${string}` ? never : key;
}>;
type HooksInNamespace<T, Namespace extends string> = ValueOf<{
  [key in Strings<T>]: key extends `${Namespace}:${infer HookName}` ? HookName : never;
}>;
type WithoutNamespace<T, Namespace extends string> = {
  [key in HooksInNamespace<T, Namespace>]: `${Namespace}:${key}` extends keyof T
    ? T[`${Namespace}:${key}`]
    : never;
};

export type NestedHooks<T> = (Partial<StripGeneric<T>> | Partial<OnlyGeneric<T>>) &
  Partial<{
    [key in Namespaces<StripGeneric<T>>]: NestedHooks<WithoutNamespace<T, key>>;
  }> &
  Partial<{ [key in BareHooks<StripGeneric<T>>]: T[key] }>;
