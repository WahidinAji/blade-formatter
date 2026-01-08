const { build, context } = require("esbuild");
const fs = require("fs/promises");
const path = require("path");

const rootDir = __dirname ? path.join(__dirname, "..") : process.cwd();
const outDir = path.join(rootDir, "out");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyFile(from, to) {
  await ensureDir(path.dirname(to));
  await fs.copyFile(from, to);
}

async function bundle() {
  const watch = process.argv.includes("--watch");

  const buildOptions = {
    entryPoints: [path.join(rootDir, "src/extension.ts")],
    outfile: path.join(outDir, "extension.js"),
    bundle: true,
    format: "cjs",
    platform: "node",
    external: ["vscode", "vscode-oniguruma", "vscode-oniguruma/release/onig.wasm", "blade-formatter"],
    sourcemap: true,
    target: "node18",
    treeShaking: true
  };

  if (watch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
    return;
  }

  await build(buildOptions);
}

async function copyRuntimeAssets() {
  const wasmSource = path.join(
    rootDir,
    "node_modules",
    "vscode-oniguruma",
    "release",
    "onig.wasm"
  );
  const wasmDest = path.join(
    outDir,
    "node_modules",
    "vscode-oniguruma",
    "release",
    "onig.wasm"
  );

  const bladeGrammarSource = path.join(
    rootDir,
    "node_modules",
    "blade-formatter",
    "syntaxes",
    "blade.tmLanguage.json"
  );
  const bladeGrammarDest = path.join(rootDir, "syntaxes", "blade.tmLanguage.json");

  await Promise.all([copyFile(wasmSource, wasmDest), copyFile(bladeGrammarSource, bladeGrammarDest)]);
}

async function copyBladeFormatter() {
  const source = path.join(rootDir, "node_modules", "blade-formatter");
  const dest = path.join(outDir, "node_modules", "blade-formatter");
  
  await copyDir(source, dest);
}

async function copyDir(source, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  await bundle();
  await copyRuntimeAssets();
  await copyBladeFormatter();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
