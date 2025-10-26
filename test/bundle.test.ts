import { describe, it, expect } from "vitest";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

describe("benchmark", () => {
  it("no side effects", async () => {
    const code = /* js */ `
      import { createHooks } from "../src/index.ts";
    `;
    const { bytes, output } = await getBundleSize(code);
    expect(output).toEqual("");
    expect(bytes).toBe(0);
  });

  it("new Hookable()", async () => {
    const code = /* js */ `
      import { Hookable } from "../src/index.ts";
      export default new Hookable()
    `;
    const { bytes, gzipSize } = await getBundleSize(code);
    // console.log("new Hookable():", { bytes, gzipSize });
    expect(bytes).toBeLessThan(3000);
    expect(gzipSize).toBeLessThan(1200);
  });
});

async function getBundleSize(code: string) {
  const res = await build({
    bundle: true,
    metafile: true,
    write: false,
    minify: true,
    format: "esm",
    platform: "node",
    outfile: "index.mjs",
    stdin: {
      contents: code,
      resolveDir: fileURLToPath(new URL(".", import.meta.url)),
      sourcefile: "index.mjs",
      loader: "js",
    },
  });

  const { bytes } = res.metafile.outputs["index.mjs"];
  const gzipSize = zlib.gzipSync(res.outputFiles[0].text).byteLength;
  return {
    bytes,
    gzipSize,
    output: new TextDecoder().decode(res.outputFiles[0].contents),
  };
}
