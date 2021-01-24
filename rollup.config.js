import clear from "rollup-plugin-clear";
import typescript from "@rollup/plugin-typescript";
import commonjs from "rollup-plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.ts",
  external: ["gl-matrix"],
  output: [
    {
      dir: "dist",
      name: "bundle",
      format: "iife",
      sourcemap: true,
    }
  ],
  plugins: [
    clear({
      targets: ["dist"]
    }),
    typescript({
      lib: ["es5", "es6", "es7", "dom"]
    }),
    resolve(),
    commonjs({
      include: [
        "node_modules/**"
      ],
    }),
  ]
};
