import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import cleanup from "rollup-plugin-cleanup";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";

const packageJson = require("./package.json");

const globals = {
	...packageJson.dependencies,
};

export default {
	input: "src/index.ts",
	external: Object.keys(globals),
	output: [
		{
			file: packageJson.main,
			format: "cjs", // commonJS
			sourcemap: true,
		},
		{
			file: packageJson.module,
			format: "esm", // ES Modules
			sourcemap: true,
		},
	],
	plugins: [
		peerDepsExternal(),
		json({
			include: ["node_modules/**"],
		}),
		typescript({
			useTsconfigDeclarationDir: true,
		}),
		commonjs({
			exclude: "node_modules",
			ignoreGlobal: true,
		}),
		babel({
			presets: ["@babel/env"],
			babelrc: false,
			exclude: "node_modules/**",
			babelHelpers: "bundled",
		}),
		resolve(),
		terser(),
		cleanup(),
	],
};
