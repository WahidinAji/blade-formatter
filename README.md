# Blade Formatter

VS Code always-on formatting for Laravel Blade templates. This extension plugs into `blade-formatter` and wires the results to the editor's Format Document action without introducing language or snippet support.

## Features

- Format any `*.blade.php` file using the same rules as [blade-formatter](https://www.npmjs.com/package/blade-formatter).
- Defaults to 2-space indentation across Blade, HTML, and script blocks.
- Read workspace settings so you can tweak line lengths, attribute wrapping, Tailwind CSS sorting, PHP nuances, and more.
- Respect `.bladeformatterrc` files when you point `bladeFormatter.runtimeConfigPath` at them.
- Surround sections with `{{-- @disable-format --}}`/`{{-- @enable-format --}}` comments when you want to keep them untouched by the formatter.

## Usage

1. Install the extension into your workspace.
2. Open a Blade template and run **Format Document** (`Shift+Alt+F` / `Shift+Option+F`).
3. Optionally enable `editor.formatOnSave` for Blade files to automatically keep them tidy.

## Examples

`@php` blocks, HTML, and scripts are normalized to 2 spaces:

```blade
@php
  $userRole = getUserRole($user);
@endphp

<div>
  <div></div>
</div>

<script>
  $('.carousel').carousel({
    interval: 500
  });
</script>
```

## Configuration

Settings live under `bladeFormatter`. A handful of the exposed knobs:

- `bladeFormatter.indentSize`, `bladeFormatter.useTabs` – control the indentation style.
- `bladeFormatter.wrapLineLength`, `bladeFormatter.wrapAttributes`, `bladeFormatter.wrapAttributesMinAttrs` – tune how attributes wrap.
- `bladeFormatter.sortTailwindcssClasses` with `bladeFormatter.tailwindcssConfigPath` – sort Tailwind classes when the flag is enabled.
- `bladeFormatter.sortHtmlAttributes`/`bladeFormatter.customHtmlAttributesOrder` – change attribute sorting rules.
- `bladeFormatter.phpVersion`, `bladeFormatter.noPhpSyntaxCheck`, `bladeFormatter.noSingleQuote`, `bladeFormatter.noTrailingCommaPhp` – tweak PHP-specific formatting.
- `bladeFormatter.extraLiners`, `bladeFormatter.componentPrefix` – add extra blank lines before tags and teach the formatter about custom components.
- `bladeFormatter.runtimeConfigPath` – point to a `.bladeformatterrc`/`.bladeformatterrc.json` file if you keep configuration outside the workspace root.

Use the built-in settings UI (`Preferences: Open Settings (UI)`) and search for `bladeFormatter` to discover every option.

## Install locally

```bash
npm install
npm run compile
npx @vscode/vsce package
code --install-extension ./blade-format-only-0.0.1.vsix
```

Or run in dev mode: `code --extensionDevelopmentPath=/path/to/repo`.

## Publish

1) Create/confirm a Marketplace publisher.  
2) Create an Azure DevOps PAT with `Marketplace (Publish)` + `Packaging (Read & write)`.  
3) `npm install -g @vscode/vsce` (or use `npx`).  
4) `vsce login <publisher>` and paste the PAT.  
5) Bump `version` in `package.json`, then `vsce publish` (or `vsce publish patch|minor|major`).

## Development

```bash
npm install
npm run compile
```

For iterative development, run `npm run watch` and reload the extension host from the VS Code debug panel.
