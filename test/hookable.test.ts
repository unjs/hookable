// @ts-nocheck
import vm from "node:vm";
import { describe, test, beforeEach, expect, vi } from "vitest";
import { Hookable, HookableCore, createDebugger, flatHooks, mergeHooks } from "../src/index.ts";

describe("HookableCore", () => {
  test("basic functionality", async () => {
    const hookable = new HookableCore<{ test(): void }>();
    hookable.hook("test", async (obj: { called: boolean }) => {
      obj.called = true;
    });
    const obj = { called: false };
    await hookable.callHook("test", obj);
    expect(obj.called).toBe(true);
  });

  test("should run remaining hooks when a hook unregisters itself", async () => {
    const hookable = new HookableCore();
    let calls = 0;
    const unregister = hookable.hook("test", () => {
      unregister();
    });
    hookable.hook("test", () => {
      calls++;
    });
    await hookable.callHook("test");
    expect(calls).toBe(1);
  });
});

describe("hookable", () => {
  beforeEach(() => {
    for (const l of ["log", "warn", "error", "debug"]) {
      console[l] = vi.fn();
    }
  });

  test("should construct hook object", () => {
    const hook = new Hookable();

    expect(hook._hooks).toEqual({});
    expect(hook._deprecatedHooks).toEqual({});
    expect(hook.hook).toBeInstanceOf(Function);
    expect(hook.callHook).toBeInstanceOf(Function);
  });

  test("should register hook successfully", () => {
    const hook = new Hookable();
    hook.hook("test:hook", () => {});
    hook.hook("test:hook", () => {});

    expect(hook._hooks["test:hook"]).toHaveLength(2);
    expect(hook._hooks["test:hook"]).toBeInstanceOf(Array);
    expect(hook._hooks["test:hook"]).toEqual([expect.any(Function), expect.any(Function)]);
  });

  test("should ignore empty hook name", () => {
    const hook = new Hookable();
    hook.hook(0, () => {});
    hook.hook("", () => {});
    hook.hook(undefined, () => {});

    expect(hook._hooks[0]).toBeUndefined();
    expect(hook._hooks[""]).toBeUndefined();
    expect(hook._hooks[undefined]).toBeUndefined();
  });

  test("should ignore non-function hook", () => {
    const hook = new Hookable();
    hook.hook("test:hook", "");
    hook.hook("test:hook");

    expect(hook._hooks["test:hook"]).toBeUndefined();
  });

  test("should convert and display deprecated hooks", () => {
    const hook = new Hookable();
    hook.deprecateHook("a", "b");
    hook.deprecateHook("b", { to: "c" });
    hook.deprecateHook("x", { to: "y", message: "Custom" });

    hook.hook("a", () => {});
    hook.hook("a", () => {});
    hook.hook("b", () => {});
    hook.hook("c", () => {});
    hook.hook("x", () => {});

    expect(console.warn).toBeCalledWith("a hook has been deprecated, please use c");
    expect(console.warn).toBeCalledWith("b hook has been deprecated, please use c");
    expect(console.warn).toBeCalledWith("Custom");
    expect(console.warn).toBeCalledTimes(3);
    expect(hook._hooks.a).toBeUndefined();
    expect(hook._hooks.b).toBeUndefined();
    expect(hook._hooks.c).toEqual([
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    ]);
  });

  test("allow hiding deprecation warns", () => {
    const hook = new Hookable();
    hook.deprecateHook("a", "b");
    hook.hook("a", () => {}, { allowDeprecated: true });
    expect(console.warn).toBeCalledTimes(0);
  });

  test("should handle deprecation after registering", () => {
    const hook = new Hookable();
    hook.hook("a", () => {});
    hook.hook("b", () => {});
    hook.deprecateHook("a", "b");
    expect(console.warn).toBeCalledWith("a hook has been deprecated, please use b");
    expect(hook._hooks.a).toBeUndefined();
    expect(hook._hooks.b).toEqual([expect.any(Function), expect.any(Function)]);
  });

  test("deprecateHooks", () => {
    const hook = new Hookable();
    hook.deprecateHooks({
      "test:hook": "test:before",
    });

    hook.hook("test:hook", () => {});

    expect(console.warn).toBeCalledWith(
      "test:hook hook has been deprecated, please use test:before",
    );
    expect(hook._hooks["test:hook"]).toBeUndefined();
    expect(hook._hooks["test:before"]).toEqual([expect.any(Function)]);
  });

  test("should call registered hook", async () => {
    const hook = new Hookable();
    hook.hook("test:hook", () => console.log("test:hook called"));

    await hook.callHook("test:hook");

    expect(console.log).toBeCalledWith("test:hook called");
  });

  test("should ignore unregistered hook", async () => {
    const hook = new Hookable();

    await hook.callHook("test:hook");

    expect(console.debug).not.toBeCalled();
  });

  test("should throw hook error", async () => {
    const hook = new Hookable();
    const error = new Error("Hook Error");
    hook.hook("test:hook", () => {
      throw error;
    });
    await expect(() => hook.callHook("test:hook")).rejects.toThrow(error);
  });

  test("should reject parallel hook error and still call other hooks", async () => {
    const hook = new Hookable();
    const error = new Error("Hook Error");
    const other = vi.fn();
    hook.hook("test:hook", () => {
      throw error;
    });
    hook.hook("test:hook", other);

    let result: unknown;
    expect(() => {
      result = hook.callHookParallel("test:hook");
    }).not.toThrow();
    await expect(result).rejects.toBe(error);
    expect(other).toHaveBeenCalledOnce();
  });

  test("should return a self-removal function", async () => {
    const hook = new Hookable();
    const remove = hook.hook("test:hook", () => {
      console.log("test:hook called");
    });

    await hook.callHook("test:hook");
    remove();
    await hook.callHook("test:hook");

    expect(console.log).toBeCalledTimes(1);
  });

  test("should clear only its own hooks", () => {
    const hook = new Hookable();
    const callback = () => {};

    hook.hook("test:hook", callback);
    const remove = hook.hook("test:hook", callback);
    hook.hook("test:hook", callback);

    expect(hook._hooks["test:hook"]).toEqual([callback, callback, callback]);

    remove();
    remove();
    remove();

    expect(hook._hooks["test:hook"]).toEqual([callback, callback]);
  });

  test("should clear removed hooks", () => {
    const hook = new Hookable();
    const callback = () => {};
    hook.hook("test:hook", callback);
    hook.hook("test:hook", callback);

    expect(hook._hooks["test:hook"]).toHaveLength(2);

    hook.removeHook("test:hook", callback);

    expect(hook._hooks["test:hook"]).toHaveLength(1);

    hook.removeHook("test:hook", callback);

    expect(hook._hooks["test:hook"]).toBeUndefined();
  });

  test("should call self-removing hooks once", async () => {
    const hook = new Hookable();
    const remove = hook.hook("test:hook", () => {
      console.log("test:hook called");
      remove();
    });

    expect(hook._hooks["test:hook"]).toHaveLength(1);

    await hook.callHook("test:hook");
    await hook.callHook("test:hook");

    expect(console.log).toBeCalledWith("test:hook called");
    expect(console.log).toBeCalledTimes(1);
    expect(hook._hooks["test:hook"]).toBeUndefined();
  });

  test("should return flat hooks", () => {
    const hooks = flatHooks({
      test: {
        hook: () => {},
        before: () => {},
      },
    });

    expect(hooks).toEqual({
      "test:hook": expect.any(Function),
      "test:before": expect.any(Function),
    });
  });

  test("should add object hooks", () => {
    const hook = new Hookable();
    hook.addHooks({
      test: {
        hook: () => {},
        before: () => {},
        // eslint-disable-next-line unicorn/no-null
        after: null,
      },
    });

    expect(hook._hooks).toEqual({
      "test:hook": expect.any(Array),
      "test:before": expect.any(Array),
      "test:after": undefined,
    });
    expect(hook._hooks["test:hook"]).toHaveLength(1);
    expect(hook._hooks["test:before"]).toHaveLength(1);
  });

  test("should clear multiple hooks", () => {
    const hook = new Hookable();
    const callback = () => {};

    const hooks = {
      test: {
        hook: () => {},
        before: () => {},
      },
    };

    hook.addHooks(hooks);

    hook.hook("test:hook", callback);

    expect(hook._hooks["test:hook"]).toHaveLength(2);
    expect(hook._hooks["test:before"]).toHaveLength(1);

    hook.removeHooks(hooks);

    expect(hook._hooks["test:hook"]).toEqual([callback]);
    expect(hook._hooks["test:before"]).toBeUndefined();
  });

  test("should clear all hooks", () => {
    const hook = new Hookable();
    const callback = () => {};

    const hooks = {
      test: {
        hook: () => {},
        before: () => {},
      },
    };

    hook.addHooks(hooks);

    hook.hook("test:hook", callback);

    expect(hook._hooks["test:hook"]).toHaveLength(2);
    expect(hook._hooks["test:before"]).toHaveLength(1);

    hook.removeAllHooks();

    expect(hook._hooks).toEqual({});
  });

  test("should clear all handlers for a specific hook", () => {
    const hook = new Hookable();
    hook.hook("test:hook", () => {});
    hook.hook("test:hook", () => {});
    hook.hook("test:other", () => {});

    expect(hook._hooks["test:hook"]).toHaveLength(2);
    expect(hook._hooks["test:other"]).toHaveLength(1);

    hook.clearHook("test:hook");

    expect(hook._hooks["test:hook"]).toBeUndefined();
    expect(hook._hooks["test:other"]).toHaveLength(1);
  });

  test("clearHook should be safe to call for non-existent hooks", () => {
    const hook = new Hookable();
    expect(() => hook.clearHook("test:nonexistent")).not.toThrow();
  });

  test("should clear only the hooks added by addHooks", () => {
    const hook = new Hookable();
    const callback1 = () => {};
    const callback2 = () => {};
    hook.hook("test:hook", callback1);

    const remove = hook.addHooks({
      test: {
        hook: () => {},
        before: () => {},
      },
    });

    hook.hook("test:hook", callback2);

    expect(hook._hooks["test:hook"]).toHaveLength(3);
    expect(hook._hooks["test:before"]).toHaveLength(1);

    remove();

    expect(hook._hooks["test:hook"]).toEqual([callback1, callback2]);
    expect(hook._hooks["test:before"]).toBeUndefined();
  });

  test("hook once", async () => {
    const hook = new Hookable();

    let x = 0;

    hook.hookOnce("test", () => {
      x++;
    });

    await hook.callHook("test");
    await hook.callHook("test");

    expect(x).toBe(1);
  });

  test("hook sync", () => {
    const hook = new Hookable();

    let x = 0;

    hook.hook("test", () => {
      x++;
    });

    const syncCaller = (hooks) => hooks.map((hook) => hook());
    hook.callHookWith(syncCaller, "test");
    hook.callHookWith(syncCaller, "test");

    expect(x).toBe(2);
  });

  test("beforeEach and afterEach spies", async () => {
    const hook = new Hookable<{ test(): void }>();

    let x = 0;

    const unreg = hook.beforeEach((event) => {
      unreg();
      expect(event.context.count).toBeUndefined();
      if (event.name === "test") {
        x++;
      }
      event.context.count = x;
    });
    hook.beforeEach((event) => {
      if (event.name === "test") {
        x++;
      }
      event.context.count = x;
    });
    hook.afterEach((event) => {
      expect(event.context.count).toEqual(x);
      if (event.name === "test") {
        x++;
      }
    });

    await hook.callHook("test");
    expect(x).toBe(3);

    await hook.callHookParallel("test");
    expect(x).toBe(5);
  });

  describe("listener spies", () => {
    test("label and fn.name fallback", async () => {
      const hooks = new Hookable();
      const labels: string[] = [];
      hooks.afterEachListener((event) => labels.push(event.label));

      hooks.hook("order:created", () => {}, { label: "Send out customer email" });
      hooks.hook("order:created", function prepareAnalytics() {});
      hooks.hook("order:created", () => {});
      hooks.hookOnce("order:created", () => {}, { label: "Notify CEO" });

      await hooks.callHook("order:created");
      expect(labels).toEqual([
        "Send out customer email",
        "prepareAnalytics",
        "_order_created_hook_cb",
        "Notify CEO",
      ]);

      labels.length = 0;
      await hooks.callHook("order:created");
      expect(labels).toHaveLength(3);
    });

    test("order with sync and async listeners", async () => {
      const hooks = new Hookable();
      const log: string[] = [];
      hooks.beforeEach(({ name }) => log.push(`emit ${name}`));
      hooks.beforeEachListener(({ label }) => log.push(`before ${label}`));
      hooks.afterEachListener(({ label, duration }) => {
        expect(duration).toBeTypeOf("number");
        log.push(`after ${label}`);
      });
      hooks.afterEach(({ name }) => log.push(`done ${name}`));

      hooks.hook("test", () => log.push("run a"), { label: "a" });
      hooks.hook(
        "test",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          log.push("run b");
        },
        { label: "b" },
      );

      await hooks.callHook("test");
      expect(log).toEqual([
        "emit test",
        "before a",
        "run a",
        "after a",
        "before b",
        "run b",
        "after b",
        "done test",
      ]);

      log.length = 0;
      await hooks.callHookParallel("test");
      expect(log).toEqual([
        "emit test",
        "before a",
        "run a",
        "after a",
        "before b",
        "run b",
        "after b",
        "done test",
      ]);
    });

    test("error is reported and still propagates", async () => {
      const hooks = new Hookable();
      const errors: unknown[] = [];
      hooks.afterEachListener((event) => errors.push(event.error));

      const syncError = new Error("sync");
      hooks.hook("sync", () => {
        throw syncError;
      });
      await expect(hooks.callHook("sync")).rejects.toBe(syncError);

      const asyncError = new Error("async");
      hooks.hook("async", async () => {
        throw asyncError;
      });
      await expect(hooks.callHook("async")).rejects.toBe(asyncError);

      hooks.hook("ok", () => {});
      await hooks.callHook("ok");

      expect(errors).toEqual([syncError, asyncError, undefined]);
    });

    test("shares context with beforeEach and gets listener args", async () => {
      const hooks = new Hookable<{ test: (a: number) => void }>();
      hooks.beforeEach((event) => {
        event.context.id = 42;
      });
      const spy = vi.fn();
      hooks.beforeEachListener(spy);
      const fn = () => {};
      hooks.hook("test", fn);

      await hooks.callHook("test", 1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ name: "test", args: [1], fn, context: { id: 42 } }),
      );
    });

    test("hookOnce runs once with spies", async () => {
      const hooks = new Hookable();
      const events: string[] = [];
      hooks.beforeEachListener(({ label }) => events.push(`before ${label}`));
      hooks.afterEachListener(({ label }) => events.push(`after ${label}`));
      const fn = vi.fn();
      hooks.hookOnce("test", fn, { label: "once" });

      await hooks.callHook("test");
      await hooks.callHook("test");
      expect(fn).toHaveBeenCalledTimes(1);
      expect(events).toEqual(["before once", "after once"]);
    });

    test("hookOnce without label falls back to the original function name", async () => {
      const hooks = new Hookable();
      const labels: string[] = [];
      hooks.afterEachListener(({ label }) => labels.push(label));
      function sendEmail() {}
      hooks.hookOnce("order:created", sendEmail);
      hooks.hookOnce("order:created", () => {});

      await hooks.callHook("order:created");
      expect(labels).toEqual(["sendEmail", "_order_created_hook_cb"]);
    });

    test("labels are per registration", async () => {
      const hooks = new Hookable();
      const labels: string[] = [];
      hooks.afterEachListener(({ name, label }) => labels.push(`${name} ${label}`));
      const shared = function shared() {};
      hooks.hook("x", shared, { label: "X label" });
      hooks.hook("y", shared, { label: "Y label" });
      await hooks.callHook("x");
      await hooks.callHook("y");
      expect(labels).toEqual(["x X label", "y Y label"]);
    });

    test("labels do not outlive their registration", async () => {
      const hooks = new Hookable();
      const labels: string[] = [];
      hooks.afterEachListener(({ label }) => labels.push(label));
      const fn = function fn() {};

      const unreg = hooks.hook("a", fn, { label: "removed via unregister" });
      unreg();
      hooks.hook("a", fn);
      await hooks.callHook("a");

      hooks.hook("b", fn, { label: "removed via removeHook" });
      hooks.removeHook("b", fn);
      hooks.hook("b", fn);
      await hooks.callHook("b");

      hooks.hook("c", fn, { label: "removed via clearHook" });
      hooks.clearHook("c");
      hooks.hook("c", fn);
      await hooks.callHook("c");

      hooks.hook("d", fn, { label: "removed via removeAllHooks" });
      hooks.removeAllHooks();
      hooks.hook("d", fn);
      await hooks.callHook("d");

      expect(labels).toEqual(["fn", "fn", "fn", "fn"]);
    });

    test("same function registered twice on one hook keeps both labels", async () => {
      const hooks = new Hookable();
      const labels: string[] = [];
      hooks.afterEachListener(({ label }) => labels.push(label));
      const fn = function fn() {};
      hooks.hook("test", fn, { label: "first" });
      const unregSecond = hooks.hook("test", fn, { label: "second" });

      await hooks.callHook("test");
      expect(labels).toEqual(["first", "second"]);

      // removeHook removes the first occurrence, remaining entries keep their labels
      labels.length = 0;
      unregSecond();
      hooks.hook("test", fn, { label: "third" });
      await hooks.callHook("test");
      expect(labels).toEqual(["second", "third"]);
    });

    test("mixed labeled and unlabeled registrations", async () => {
      const hooks = new Hookable();
      const labels: string[] = [];
      hooks.afterEachListener(({ label }) => labels.push(label));
      function a() {}
      function b() {}
      function c() {}
      function d() {}
      hooks.hook("test", a);
      hooks.hook("test", b, { label: "B" });
      hooks.hook("test", c);
      hooks.hook("test", d, { label: "D" });

      await hooks.callHook("test");
      expect(labels).toEqual(["a", "B", "c", "D"]);

      labels.length = 0;
      hooks.removeHook("test", a);
      hooks.removeHook("test", c);
      hooks.hook("test", a);
      await hooks.callHook("test");
      expect(labels).toEqual(["B", "D", "a"]);
    });

    test("addHooks listeners use their function names", async () => {
      const hooks = new Hookable();
      const labels: string[] = [];
      hooks.afterEachListener(({ name, label }) => labels.push(`${name} ${label}`));
      hooks.addHooks({ order: { created: function sendEmail() {} } });

      await hooks.callHook("order:created");
      expect(labels).toEqual(["order:created sendEmail"]);
    });

    test("labels keep their position through deprecateHook", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const hooks = new Hookable();
      const labels: string[] = [];
      hooks.afterEachListener(({ label }) => labels.push(label));
      function a() {}
      function b() {}
      hooks.hook("new", function existing() {});
      hooks.hook("old", a);
      hooks.hook("old", b, { label: "B" });
      hooks.deprecateHook("old", "new");
      hooks.hook("old", () => {}, { label: "allowed", allowDeprecated: true });

      await hooks.callHook("new");
      expect(labels).toEqual(["existing", "a", "B", "allowed"]);
      warn.mockRestore();
    });

    test("spies added or removed during a call", async () => {
      const hooks = new Hookable();
      const log: string[] = [];
      const late = vi.fn(({ label }) => log.push(`late ${label}`));
      const unregEarly = hooks.afterEachListener(({ label }) => log.push(`early ${label}`));
      hooks.hook(
        "test",
        () => {
          unregEarly();
          hooks.afterEachListener(late);
        },
        { label: "a" },
      );
      hooks.hook("test", () => {}, { label: "b" });

      await hooks.callHook("test");
      expect(log).toEqual(["late a", "late b"]);
    });

    test("listeners removed during a call still run once and are reported", async () => {
      const hooks = new Hookable();
      const labels: string[] = [];
      hooks.afterEachListener(({ label }) => labels.push(label));
      const second = () => {};
      hooks.hook("test", () => hooks.removeHook("test", second), { label: "remover" });
      hooks.hook("test", second, { label: "second" });

      await hooks.callHook("test");
      await hooks.callHook("test");
      expect(labels).toEqual(["remover", "second", "remover"]);
    });

    test("a throwing listener spy propagates like beforeEach/afterEach spies", async () => {
      const hooks = new Hookable();
      const listener = vi.fn();
      hooks.beforeEachListener(() => {
        throw new Error("logger bug");
      });
      hooks.hook("test", listener);

      await expect(hooks.callHook("test")).rejects.toThrow("logger bug");
      expect(listener).not.toHaveBeenCalled();
    });

    test("parallel calls fire all before spies first", async () => {
      const hooks = new Hookable();
      const log: string[] = [];
      hooks.beforeEachListener(({ label }) => log.push(`before ${label}`));
      hooks.afterEachListener(({ label }) => log.push(`after ${label}`));
      hooks.hook("test", async () => {}, { label: "a" });
      hooks.hook("test", async () => {}, { label: "b" });

      await hooks.callHookParallel("test");
      expect(log).toEqual(["before a", "before b", "after a", "after b"]);
    });

    test("works together with createDebugger", async () => {
      const time = vi.spyOn(console, "time").mockImplementation(() => {});
      const timeEnd = vi.spyOn(console, "timeEnd").mockImplementation(() => {});
      const hooks = new Hookable();
      const labels: string[] = [];
      const debug = createDebugger(hooks, { inspect: false, group: false });
      hooks.afterEachListener(({ label }) => labels.push(label));
      hooks.hook("test", async () => {}, { label: "a" });

      await hooks.callHook("test");
      expect(labels).toEqual(["a"]);
      expect(time).toHaveBeenCalledTimes(1);
      expect(timeEnd).toHaveBeenCalledTimes(1);
      debug.close();
      time.mockRestore();
      timeEnd.mockRestore();
    });

    test("label survives deprecateHook and reports the new name", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const hooks = new Hookable();
      const events: string[] = [];
      hooks.afterEachListener(({ name, label }) => events.push(`${name} ${label}`));
      hooks.hook("old", () => {}, { label: "registered before" });
      hooks.deprecateHook("old", "new");
      hooks.hook("old", () => {}, { label: "registered after" });

      await hooks.callHook("new");
      expect(events).toEqual(["new registered before", "new registered after"]);
      warn.mockRestore();
    });

    test("return values and sync behavior are preserved", async () => {
      const hooks = new Hookable();
      hooks.afterEachListener(() => {});
      hooks.hook("test", (x: number) => x * 2);
      hooks.hook("test", async (x: number) => x * 3);

      const results = hooks.callHookWith((fns, args) => fns.map((fn) => fn(...args)), "test", [5]);
      expect(results[0]).toBe(10);
      await expect(results[1]).resolves.toBe(15);
      await expect(hooks.callHookParallel("test", 2)).resolves.toEqual([4, 6]);

      hooks.hook("sync", () => {});
      expect(hooks.callHook("sync")).toBeUndefined();
    });

    test("parallel rejection reports failing and passing listeners", async () => {
      const hooks = new Hookable();
      const events: [string, unknown][] = [];
      hooks.afterEachListener(({ label, error }) => events.push([label, error]));
      const error = new Error("fail");
      hooks.hook(
        "test",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
        },
        { label: "slow" },
      );
      hooks.hook(
        "test",
        async () => {
          throw error;
        },
        { label: "failing" },
      );

      await expect(hooks.callHookParallel("test")).rejects.toBe(error);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(events).toEqual([
        ["failing", error],
        ["slow", undefined],
      ]);
    });

    test("waits for cross-realm thenables and measures duration", async () => {
      const foreignAsync = vm.runInContext(
        `(async () => { await new Promise((r) => setTimeout(r, 20)); })`,
        vm.createContext({ setTimeout }),
      );
      const hooks = new Hookable();
      const events: any[] = [];
      hooks.beforeEachListener((event) => events.push(["before", event]));
      hooks.afterEachListener((event) => events.push(["after", event.duration]));
      hooks.hook("test", foreignAsync);

      const promise = hooks.callHook("test");
      expect(events).toHaveLength(1);
      await promise;
      expect(events).toHaveLength(2);
      expect(events[0][1].duration).toBeGreaterThanOrEqual(15);
      expect(events[1][1]).toBeGreaterThanOrEqual(15);
    });

    test("same event object for before and after, context per call", async () => {
      const hooks = new Hookable();
      const before: any[] = [];
      const after: any[] = [];
      hooks.beforeEachListener((event) => before.push(event));
      hooks.afterEachListener((event) => after.push(event));
      hooks.hook("test", () => {});
      hooks.hook("test", () => {});

      await hooks.callHook("test");
      await hooks.callHook("test");
      expect(before).toHaveLength(4);
      expect(after).toEqual(before);
      for (let i = 0; i < 4; i++) {
        expect(after[i]).toBe(before[i]);
      }
      expect(before[0].context).toEqual({});
      expect(before[0].context).toBe(before[1].context);
      expect(before[0].context).not.toBe(before[2].context);
    });

    test("unregistering a spy twice keeps other spies", async () => {
      const hooks = new Hookable();
      const a = vi.fn();
      const b = vi.fn();
      const unregA = hooks.beforeEachListener(a);
      hooks.beforeEachListener(b);
      unregA();
      unregA();
      hooks.hook("test", () => {});

      await hooks.callHook("test");
      expect(a).not.toHaveBeenCalled();
      expect(b).toHaveBeenCalledTimes(1);
    });

    test("works with destructured hook and callHook", async () => {
      const hooks = new Hookable();
      const labels: string[] = [];
      hooks.afterEachListener(({ label }) => labels.push(label));
      const { hook, callHook } = hooks;
      hook("test", () => {}, { label: "destructured" });

      await callHook("test");
      expect(labels).toEqual(["destructured"]);
    });

    test("no wrapping without spies and unregister", async () => {
      const hooks = new Hookable();
      const fn = () => {};
      hooks.hook("test", fn);

      let received: any[] = [];
      const caller = (fns: any[]) => {
        received = fns;
        for (const f of fns) {
          f();
        }
      };

      hooks.callHookWith(caller, "test", []);
      expect(received[0]).toBe(fn);

      const spy = vi.fn();
      const unreg = hooks.afterEachListener(spy);
      hooks.callHookWith(caller, "test", []);
      expect(received[0]).not.toBe(fn);
      expect(spy).toHaveBeenCalledTimes(1);

      unreg();
      hooks.callHookWith(caller, "test", []);
      expect(received[0]).toBe(fn);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  test("mergeHooks", () => {
    const function_ = () => {};
    const hooks1 = {
      foo: function_,
      bar: function_,
      "a:b": function_,
      "a:c": function_,
    };
    const hooks2 = {
      foo: function_,
      baz: function_,
      a: {
        b: function_,
        d: function_,
      },
    };

    const merged = mergeHooks(hooks1, hooks2);

    expect(Object.keys(merged)).toMatchObject(["foo", "bar", "a:b", "a:c", "baz", "a:d"]);
  });

  test("arguments", async () => {
    let result;
    const hooks = new Hookable();
    hooks.hook("test", (a: number, b: number) => (result = a + b));
    await hooks.callHook("test", 1, 2);
    expect(result).toBe(3);
  });

  test("callEachWith", async () => {
    let result = 0;
    const hooks = new Hookable();
    hooks.hookOnce("test", () => result++);
    hooks.hookOnce("test", () => result++);
    hooks.hookOnce("test", () => result++);
    const customSerialCaller = (hooks) => {
      for (const hook of hooks) {
        hook();
      }
    };
    await hooks.callHookWith(customSerialCaller, "test");
    expect(result).toBe(3);
  });

  // Regression: https://github.com/nitrojs/nitro/issues/4203
  // Cross-realm Promises (e.g. from jiti/vm) fail `instanceof Promise`,
  // so hookable must detect thenables and await them regardless.
  test("awaits cross-realm thenables returned by async hooks", async () => {
    const context = vm.createContext({});
    const foreignAsync = vm.runInContext(
      `(async (obj) => { await Promise.resolve(); obj.called = true; })`,
      context,
    );

    const probe = foreignAsync({ called: false });
    expect(typeof probe.then).toBe("function");
    expect(probe instanceof Promise).toBe(false);

    const hooks = new Hookable();
    hooks.hook("test", foreignAsync);

    const obj = { called: false };
    await hooks.callHook("test", obj);
    expect(obj.called).toBe(true);

    // Also verify the next hook runs *after* the foreign thenable settles.
    const order: string[] = [];
    const foreignOrderedAsync = vm.runInContext(
      `(async (arr) => { await Promise.resolve(); await Promise.resolve(); arr.push("first"); })`,
      context,
    );
    const hooks2 = new Hookable();
    hooks2.hook("t", foreignOrderedAsync);
    hooks2.hook("t", (arr: string[]) => {
      arr.push("second");
    });
    await hooks2.callHook("t", order);
    expect(order).toEqual(["first", "second"]);
  });
});
