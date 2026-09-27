import { AsyncLocalStorage } from "node:async_hooks";
import { tracingChannel } from "node:diagnostics_channel";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTracer, Hookable } from "../src/index.ts";

const eventTypes = ["start", "end", "asyncStart", "asyncEnd", "error"] as const;

describe("tracer", () => {
  const channel = tracingChannel<unknown, any>("hookable:test");
  let hooks: Hookable<any>;
  let events: [string, any][];
  const handlers = Object.fromEntries(
    eventTypes.map((type) => [type, (ctx: any) => events.push([type, { ...ctx }])]),
  ) as any;

  beforeEach(() => {
    hooks = new Hookable();
    events = [];
    channel.subscribe(handlers);
  });
  afterEach(() => {
    channel.unsubscribe(handlers);
  });

  it("should publish `start` and `asyncEnd` with name and args", async () => {
    hooks.hook("hook", () => "result");
    createTracer(hooks, { channel: "hookable:test" });
    await hooks.callHook("hook", 1);
    expect(events.map(([type]) => type)).toEqual(["start", "end", "asyncStart", "asyncEnd"]);
    expect(events[0][1]).toEqual({ name: "hook", args: [1] });
    expect(events[3][1]).toMatchObject({ name: "hook", args: [1] });
  });
  it("should trace `callHookParallel`", async () => {
    hooks.hook("hook", () => {});
    createTracer(hooks, { channel: "hookable:test" });
    await hooks.callHookParallel("hook");
    expect(events[0]).toEqual(["start", { name: "hook", args: [] }]);
  });
  it("should trace `callHookWith` and preserve sync results", () => {
    hooks.hook("hook", () => {});
    createTracer(hooks, { channel: "hookable:test" });
    expect(hooks.callHookWith((fns) => fns.length, "hook", [])).toBe(1);
    expect(events[0]).toEqual(["start", { name: "hook", args: [] }]);
  });
  it("should publish `error` when a hook throws", async () => {
    hooks.hook("hook", () => {
      throw new Error("boom");
    });
    createTracer(hooks, { channel: "hookable:test" });
    await expect(hooks.callHook("hook")).rejects.toThrow("boom");
    expect(events.find(([type]) => type === "error")?.[1].error.message).toBe("boom");
  });
  it("should skip hooks without listeners", async () => {
    createTracer(hooks, { channel: "hookable:test" });
    await hooks.callHook("hook");
    expect(events).toEqual([]);
  });
  it("should respect `filter` option as string", async () => {
    hooks.hook("hook", () => {});
    hooks.hook("other:hook", () => {});
    createTracer(hooks, { channel: "hookable:test", filter: "other:" });
    await hooks.callHook("hook");
    expect(events).toEqual([]);
    await hooks.callHook("other:hook");
    expect(events).not.toEqual([]);
  });
  it("should respect `filter` option as function", async () => {
    hooks.hook("hook", () => {});
    hooks.hook("other:hook", () => {});
    createTracer(hooks, { channel: "hookable:test", filter: (id) => id === "other:hook" });
    await hooks.callHook("hook");
    expect(events).toEqual([]);
    await hooks.callHook("other:hook");
    expect(events).not.toEqual([]);
  });
  it("should run listeners inside the bound store", async () => {
    const als = new AsyncLocalStorage<string>();
    channel.start.bindStore(als, (ctx) => `span:${ctx.name}`);
    let store: string | undefined;
    hooks.hook("hook", async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      store = als.getStore();
    });
    createTracer(hooks, { channel: "hookable:test" });
    await hooks.callHook("hook");
    channel.start.unbindStore(als);
    expect(store).toBe("span:hook");
  });
  it("should allow closing tracer", async () => {
    hooks.hook("hook", () => {});
    const tracer = createTracer(hooks, { channel: "hookable:test" });
    tracer.close();
    await hooks.callHook("hook");
    expect(events).toEqual([]);
  });
  it("should allow closing tracers in any order", async () => {
    hooks.hook("hook", () => {});
    const original = hooks.callHookWith;
    const first = createTracer(hooks, { channel: "hookable:test" });
    const second = createTracer(hooks, { channel: "hookable:test" });
    first.close();
    await hooks.callHook("hook");
    expect(events.filter(([type]) => type === "start")).toHaveLength(1);
    second.close();
    expect(hooks.callHookWith).toBe(original);
  });
});
