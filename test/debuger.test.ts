import { afterAll, beforeAll, describe, it, beforeEach, expect, vi } from "vitest";
import { createDebugger, Hookable } from "../src/index.ts";

const consoleMethods = ["time", "timeEnd", "timeLog", "groupCollapsed", "groupEnd"] as const;

describe("debugger", () => {
  let hooks: Hookable;

  beforeAll(() => {
    for (const l of consoleMethods) {
      console[l] = vi.fn();
    }
  });
  beforeEach(() => {
    hooks = new Hookable();
    vi.clearAllMocks();
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should respect `tag` option", async () => {
    createDebugger(hooks, { tag: "tag" });
    await hooks.callHook("hook");
    expect(console.time).toBeCalledWith(expect.stringContaining("[tag] hook"));
    expect(console.timeEnd).toBeCalledWith(expect.stringContaining("[tag] hook"));
  });
  it("should respect `inspect` option", async () => {
    createDebugger(hooks, { inspect: true });
    await hooks.callHook("hook");
    expect(console.time).toBeCalledWith(expect.stringContaining("hook"));
    expect(console.timeLog).toBeCalledWith("hook", []);
  });
  it("should respect `group` option", async () => {
    createDebugger(hooks, { group: true });
    await hooks.callHook("hook");
    expect(console.groupCollapsed).toBeCalled();
    expect(console.groupEnd).toBeCalled();
  });
  it("should respect `filter` option as string", async () => {
    createDebugger(hooks, { filter: "other:" });
    await hooks.callHook("hook");
    expect(console.time).not.toBeCalled();
    await hooks.callHook("other:hook");
    expect(console.time).toBeCalled();
  });
  it("should respect `filter` option as function", async () => {
    createDebugger(hooks, { filter: (id) => id === "other:hook" });
    await hooks.callHook("hook");
    expect(console.time).not.toBeCalled();
    await hooks.callHook("other:hook");
    expect(console.time).toBeCalled();
  });
  it("should keep timer labels unique for overlapping calls", async () => {
    const pending: Array<() => void> = [];
    hooks.hook("hook", () => new Promise<void>((resolve) => pending.push(resolve)));
    createDebugger(hooks, { inspect: false, group: false });

    const first = hooks.callHook("hook");
    const second = hooks.callHook("hook");
    pending.shift()!();
    await first;

    const third = hooks.callHook("hook");
    pending.shift()!();
    pending.shift()!();
    await Promise.all([second, third]);

    const labels = vi.mocked(console.time).mock.calls.map(([label]) => label);
    expect(labels).toHaveLength(3);
    expect(labels[2]).not.toBe(labels[1]);
  });
  it("should allowing closing debugger", async () => {
    const debug = createDebugger(hooks);
    await hooks.callHook("hook");
    expect(console.time).toBeCalled();
    debug.close();
    vi.clearAllMocks();
    await hooks.callHook("hook");
    expect(console.time).not.toBeCalled();
    debug.close();
  });
});
