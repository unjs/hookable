export type HookCallback = (...arguments_: any) => Promise<void> | void;
export interface Hooks {
  [key: string]: HookCallback;
}
export type HookKeys<T> = keyof T & string;
export type DeprecatedHook<T> = { message?: string; to: HookKeys<T> };
// eslint-disable-next-line no-unused-vars
export type DeprecatedHooks<T> = { [name in HookKeys<T>]: DeprecatedHook<T> };

export type Thenable<T> = Promise<T> | T;

// Utilities
type ValueOf<C> = C extends Record<any, any> ? C[keyof C] : never;
type Strings<T> = Exclude<keyof T, number | symbol>;
type KnownKeys<T> = keyof {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : K]: never;
};
type StripGeneric<T> = Pick<
  T,
  KnownKeys<T> extends keyof T ? KnownKeys<T> : never
>;
type OnlyGeneric<T> = Omit<
  T,
  KnownKeys<T> extends keyof T ? KnownKeys<T> : never
>;

// Unwrapping utilities
type Namespaces<T> = ValueOf<{
  [key in Strings<T>]: key extends `${infer Namespace}:${string}`
    ? Namespace
    : never;
}>;
type BareHooks<T> = ValueOf<{
  [key in Strings<T>]: key extends `${string}:${string}` ? never : key;
}>;
type HooksInNamespace<T, Namespace extends string> = ValueOf<{
  [key in Strings<T>]: key extends `${Namespace}:${infer HookName}`
    ? HookName
    : never;
}>;
type WithoutNamespace<T, Namespace extends string> = {
  [key in HooksInNamespace<T, Namespace>]: `${Namespace}:${key}` extends keyof T
    ? T[`${Namespace}:${key}`]
    : never;
};

export type NestedHooks<T> = (
  | Partial<StripGeneric<T>>
  | Partial<OnlyGeneric<T>>
) &
  Partial<{
    [key in Namespaces<StripGeneric<T>>]: NestedHooks<WithoutNamespace<T, key>>;
  }> &
  Partial<{ [key in BareHooks<StripGeneric<T>>]: T[key] }>;
