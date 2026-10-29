// @ts-nocheck
import { describe, expect, test, vi } from "vitest";
import * as next from "../src/index.ts";
import * as prev from "hookable-prev";

type Impl = typeof next;

const tick = () => new Promise((r) => setTimeout(r, 1));

const scenarios: Record<string, (impl: Impl, log: any[]) => Promise<void> | void> = {
  "serial order sync/async with args": async ({ Hookable }, log) => {
    const h = new Hookable();
    h.hook("a", (x: number) => log.push(["s1", x]));
    h.hook("a", async (x: number) => {
      await tick();
      log.push(["a2", x]);
    });
    h.hook("a", (x: number) => log.push(["s3", x]));
    const r = h.callHook("a", 7);
    log.push(["isPromise", r instanceof Promise]);
    log.push(["resolved", await r]);
  },
  "sync-only callHook returns non-promise": ({ Hookable }, log) => {
    const h = new Hookable();
    h.hook("a", () => log.push("x"));
    const r = h.callHook("a");
    log.push(["result", r, r instanceof Promise]);
    log.push(["empty", h.callHook("none")]);
    log.push(["emptyParallel", h.callHookParallel("none")]);
  },
  parallel: async ({ Hookable }, log) => {
    const h = new Hookable();
    h.hook("a", async () => {
      await tick();
      log.push("slow");
      return 1;
    });
    h.hook("a", () => {
      log.push("fast");
      return 2;
    });
    log.push(["values", await h.callHookParallel("a")]);
  },
  "errors serial and parallel": async ({ Hookable }, log) => {
    const h = new Hookable();
    h.hook("sync", () => {
      throw new Error("s");
    });
    h.hook("sync", () => log.push("should not run"));
    h.hook("async", async () => {
      throw new Error("a");
    });
    h.hook("async", () => log.push("should not run"));
    for (const [name, fn] of [
      ["sync", "callHook"],
      ["async", "callHook"],
      ["sync", "callHookParallel"],
      ["async", "callHookParallel"],
    ] as const) {
      try {
        await (h as any)[fn](name);
        log.push("no error");
      } catch (error: any) {
        log.push([name, fn, error.message]);
      }
    }
  },
  "hookOnce, removeHook, unregister, clear": async ({ Hookable }, log) => {
    const h = new Hookable();
    h.hookOnce("a", () => log.push("once"));
    const fn = () => log.push("fn");
    const un = h.hook("a", fn);
    await h.callHook("a");
    await h.callHook("a");
    un();
    un();
    await h.callHook("a");
    h.hook("a", fn);
    h.removeHook("a", fn);
    await h.callHook("a");
    h.hook("b", fn);
    h.clearHook("b");
    await h.callHook("b");
    h.hook("c", fn);
    h.removeAllHooks();
    await h.callHook("c");
    log.push(["invalid", typeof h.hook("", fn), typeof h.hook("x", null as any)]);
    (h.hook("x", null as any) as any)();
  },
  "addHooks / removeHooks nested": async ({ Hookable }, log) => {
    const h = new Hookable();
    const fn = (n: string) => log.push(n);
    const un = h.addHooks({ a: { b: () => fn("a:b"), c: { d: () => fn("a:c:d") } }, e: fn });
    await h.callHook("a:b");
    await h.callHook("a:c:d");
    await h.callHook("e", "e");
    un();
    await h.callHook("a:b");
    h.addHooks({ e: fn });
    h.removeHooks({ e: fn });
    await h.callHook("e", "e2");
  },
  deprecation: async ({ Hookable }, log) => {
    const warn = vi.spyOn(console, "warn").mockImplementation((m) => log.push(["warn", m]));
    const h = new Hookable();
    h.hook("old", () => log.push("old-before"));
    h.deprecateHook("old", "new");
    h.hook("old", () => log.push("old-after"));
    h.hook("old", () => log.push("old-after2"));
    h.deprecateHooks({ older: { to: "new", message: "custom" } } as any);
    h.hook("older", () => log.push("older"));
    h.hook("older", () => log.push("older-allowed"), { allowDeprecated: true });
    await h.callHook("new");
    warn.mockRestore();
  },
  "beforeEach / afterEach": async ({ Hookable }, log) => {
    const h = new Hookable();
    const un = h.beforeEach((e) => {
      log.push(["before1", e.name, e.args, { ...e.context }]);
      e.context.x = 1;
      un();
    });
    h.beforeEach((e) => log.push(["before2", e.name, { ...e.context }]));
    const un2 = h.afterEach((e) => log.push(["after", e.name, e.args, e.context]));
    h.hook("a", async () => log.push("run"));
    await h.callHook("a", 1, 2);
    await h.callHookParallel("a", 3);
    h.callHook("nohooks");
    un2();
    un2();
    await h.callHook("a");
  },
  "callHookWith custom caller": async ({ Hookable }, log) => {
    const h = new Hookable();
    h.hook("a", (x: number) => x * 2);
    h.hook("a", (x: number) => x * 3);
    const result = h.callHookWith(
      (hooks, args, name) => [name, hooks.length, hooks.map((fn) => fn(...args))],
      "a",
      [5],
    );
    log.push(result);
  },
  "auto fn names and named fns": ({ Hookable }, log) => {
    const h = new Hookable();
    const anon = [() => {}][0];
    function named() {}
    h.hook("my:hook-name", anon);
    h.hook("x", named);
    log.push([anon.name, named.name]);
  },
  destructuring: async ({ Hookable, createHooks }, log) => {
    const { hook, callHook, callHookWith } = new Hookable();
    hook("a", (x: number) => log.push(x));
    await callHook("a", 1);
    callHookWith((hooks, args) => hooks.forEach((fn) => fn(...args)), "a", [2]);
    const h2 = createHooks();
    h2.hook("b", () => log.push("created"));
    await h2.callHook("b");
  },
  "mutation during call": async ({ Hookable }, log) => {
    const h = new Hookable();
    const second = () => log.push("second");
    h.hook("a", () => {
      log.push("first");
      h.removeHook("a", second);
      h.hook("a", () => log.push("added"));
    });
    h.hook("a", second);
    await h.callHook("a");
    await h.callHook("a");
  },
  HookableCore: async ({ HookableCore }, log) => {
    const h = new HookableCore();
    const fn = async (x: number) => {
      await tick();
      log.push(x);
    };
    const un = h.hook("a", fn);
    h.hook("a", (x: number) => log.push(x * 10));
    await h.callHook("a", 1);
    un();
    log.push(["after-unreg", await h.callHook("a", 2)]);
    log.push(["empty", h.callHook("none")]);
  },
  utils: async (impl, log) => {
    log.push(Object.keys(impl.flatHooks({ a: { b: () => {}, c: { d: () => {} } }, e: () => {} })));
    const merged = impl.mergeHooks(
      { a: () => log.push("m1"), b: () => {} },
      { a: () => log.push("m2") },
    ) as any;
    await merged.a();
    log.push(Object.keys(merged));
    await impl.serial([1, 2], async (n) => log.push(["serial", n]));
    await impl.serialCaller([() => log.push("sc")]);
    await impl.parallelCaller([() => log.push("pc")]);
  },
};

describe("differential: new src vs hookable-prev (6.1.1)", () => {
  for (const [name, run] of Object.entries(scenarios)) {
    test(name, async () => {
      const prevLog: any[] = [];
      const nextLog: any[] = [];
      await run(prev as unknown as Impl, prevLog);
      await run(next, nextLog);
      expect(nextLog.length).toBeGreaterThan(0);
      expect(nextLog).toEqual(prevLog);
    });
  }

  class SpiedHookable extends next.Hookable<any> {
    constructor() {
      super();
      this.beforeEachListener((e) => spyEvents.push(["before", e.name, e.label]));
      this.afterEachListener((e) => spyEvents.push(["after", e.name, e.label, !!e.error]));
    }
  }
  const spyEvents: any[] = [];
  const spied = {
    ...next,
    Hookable: SpiedHookable,
    createHooks: () => new SpiedHookable(),
  } as unknown as Impl;

  for (const [name, run] of Object.entries(scenarios)) {
    test(`with listener spies active: ${name}`, async () => {
      const prevLog: any[] = [];
      const nextLog: any[] = [];
      spyEvents.length = 0;
      await run(prev as unknown as Impl, prevLog);
      await run(spied, nextLog);
      expect(nextLog).toEqual(prevLog);
      if (!["HookableCore", "utils", "auto fn names and named fns"].includes(name)) {
        expect(spyEvents.length).toBeGreaterThan(0);
        const befores = spyEvents.filter((e) => e[0] === "before").length;
        const afters = spyEvents.filter((e) => e[0] === "after").length;
        expect(afters).toBe(befores);
      }
    });
  }

  test("exports are a superset of previous exports", () => {
    for (const key of Object.keys(prev)) {
      expect(next).toHaveProperty(key);
    }
    for (const key of Object.getOwnPropertyNames(prev.Hookable.prototype)) {
      expect(next.Hookable.prototype).toHaveProperty(key);
    }
  });
});
