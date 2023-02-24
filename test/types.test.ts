import { describe, test } from "vitest";
import { expectTypeOf } from "expect-type";
import { createHooks } from "../src";
import type { HookCallback } from "../src/types";

describe("hook types", () => {
  test("correctly handles non-nested hooks", () => {
    const hooks = createHooks<{
      foo: () => true;
      bar: (_argument: string) => 42;
    }>();

    expectTypeOf(hooks.hook).parameter(0).not.toBeAny();
    expectTypeOf(hooks.hook).parameter(0).toEqualTypeOf<"foo" | "bar">();

    // @ts-expect-error
    hooks.hook("foo", (_parameter) => true);
  });

  test("deprecates hooks", () => {
    const hooks = createHooks<{
      foo: () => true;
      bar: (_argument: string) => 42;
    }>();
    hooks.deprecateHooks({
      foo: { to: "bar" },
    });
  });

  test("handles nested hooks", () => {
    const hooks = createHooks<{
      "namespace:foo": (argument: number) => void;
      bar: (_argument: string) => void;
      "namespace:baz": (argument: "42") => void;
    }>();

    // should be valid
    hooks.addHooks({
      namespace: { foo: (_argument) => {}, baz: (_argument) => {} },
      bar: (_argument) => {},
      "namespace:foo": () => {},
    });
    // @ts-expect-error
    hooks.addHooks({ a: (_argument) => {} });
    // @ts-expect-error
    hooks.addHooks({ namespace: { nonexistent: (_argument) => {} } });
  });

  test("handles nested hooks with signature", () => {
    const hooks = createHooks<{
      [key: string]: HookCallback;
      "namespace:foo": (argument: number) => void;
      bar: (_argument: string) => void;
    }>();

    // should both be valid
    hooks.addHooks({
      namespace: { foo: (_argument) => {} },
      bar: (_argument) => {},
      "namespace:foo": () => {},
    });
    hooks.addHooks({ namespace: { nothing: (_argument) => {} } });
    hooks.addHooks({ nothing: (_argument) => {} });
  });

  test("beforeEach and afterEach typings", () => {
    const hooks = createHooks<{
      foo: () => true;
      bar: (_argument: number) => 42;
    }>();

    expectTypeOf(hooks.beforeEach).parameter(0).not.toBeAny();
    expectTypeOf(hooks.afterEach)
      .parameter(0)
      .parameter(0)
      .toEqualTypeOf<
        | { name: "foo"; args: []; context: Record<string, any> }
        | { name: "bar"; args: [number]; context: Record<string, any> }
      >();

    hooks.beforeEach(({ name, args }) => {
      expectTypeOf(name).toEqualTypeOf<"foo" | "bar">();
      if (name === "foo") {
        expectTypeOf(args).toEqualTypeOf<[]>();
      }
      if (name === "bar") {
        expectTypeOf(args[0]).toEqualTypeOf<number>();
      }
    });
  });
});
