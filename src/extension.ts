import path from "path";
import * as vscode from "vscode";
import { BladeFormatter, BladeFormatterOption } from "blade-formatter";

const CONFIG_NAMESPACE = "bladeFormatter";

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.languages.registerDocumentFormattingEditProvider("blade", {
    provideDocumentFormattingEdits(document, _options, token) {
      return formatBladeDocument(document, token);
    }
  });

  context.subscriptions.push(disposable);
}

async function formatBladeDocument(
  document: vscode.TextDocument,
  token: vscode.CancellationToken
): Promise<vscode.TextEdit[]> {
  const originalText = document.getText();
  if (originalText.length === 0) {
    return [];
  }

  const formatter = new BladeFormatter(buildFormatterOptions(document));
  const regions = splitByDisableMarkers(originalText);

  try {
    let formattedBuffer = "";

    for (const region of regions) {
      if (token.isCancellationRequested) {
        return [];
      }

      if (!region.shouldFormat) {
        formattedBuffer += region.content;
        continue;
      }

      if (region.content.length === 0) {
        continue;
      }

      const formattedRegion = (await formatter.format(region.content)) as string;
      formattedBuffer += formattedRegion;
    }

    if (token.isCancellationRequested || formattedBuffer === originalText) {
      return [];
    }

    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(originalText.length)
    );

    return [vscode.TextEdit.replace(fullRange, formattedBuffer)];
  } catch (error) {
    console.error("Blade Formatter failed", error);
    void vscode.window.showErrorMessage(
      `Blade Formatter failed: ${(error as Error).message ?? "Unknown error"}`
    );
    return [];
  }
}

function buildFormatterOptions(document: vscode.TextDocument): BladeFormatterOption {
  const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE, document.uri);
  const options: BladeFormatterOption = {};

  const indentSize = config.get<number>("indentSize");
  if (typeof indentSize === "number") {
    options.indentSize = indentSize;
  }

  const wrapLineLength = config.get<number>("wrapLineLength");
  if (typeof wrapLineLength === "number") {
    options.wrapLineLength = wrapLineLength;
  }

  const wrapAttributes = getStringSetting(config, "wrapAttributes");
  if (wrapAttributes) {
    options.wrapAttributes = wrapAttributes as BladeFormatterOption["wrapAttributes"];
  }

  const wrapAttributesMinAttrs = config.get<number>("wrapAttributesMinAttrs");
  if (typeof wrapAttributesMinAttrs === "number") {
    options.wrapAttributesMinAttrs = wrapAttributesMinAttrs;
  }

  const indentInnerHtml = config.get<boolean>("indentInnerHtml");
  if (typeof indentInnerHtml === "boolean") {
    options.indentInnerHtml = indentInnerHtml;
  }

  const endWithNewline = config.get<boolean>("endWithNewline");
  if (typeof endWithNewline === "boolean") {
    options.endWithNewline = endWithNewline;
  }

  const endOfLineValue = getStringSetting(config, "endOfLine");
  if (endOfLineValue) {
    options.endOfLine = endOfLineValue as BladeFormatterOption["endOfLine"];
  }

  const useTabs = config.get<boolean>("useTabs");
  if (typeof useTabs === "boolean") {
    options.useTabs = useTabs;
  }

  if (config.get<boolean>("sortTailwindcssClasses")) {
    options.sortTailwindcssClasses = true;
  }

  const tailwindConfigPath = getStringSetting(config, "tailwindcssConfigPath");
  if (tailwindConfigPath) {
    options.tailwindcssConfigPath = resolveWorkspacePath(tailwindConfigPath, document);
  }

  const sortHtmlAttributes = getStringSetting(config, "sortHtmlAttributes");
  if (sortHtmlAttributes) {
    options.sortHtmlAttributes = sortHtmlAttributes as BladeFormatterOption["sortHtmlAttributes"];
  }

  const customHtmlAttributesOrder = sanitizeStringArray(
    config.get<string[]>("customHtmlAttributesOrder")
  );
  if (customHtmlAttributesOrder.length) {
    options.customHtmlAttributesOrder = customHtmlAttributesOrder;
  }

  const noMultipleEmptyLines = config.get<boolean>("noMultipleEmptyLines");
  if (typeof noMultipleEmptyLines === "boolean") {
    options.noMultipleEmptyLines = noMultipleEmptyLines;
  }

  const noPhpSyntaxCheck = config.get<boolean>("noPhpSyntaxCheck");
  if (typeof noPhpSyntaxCheck === "boolean") {
    options.noPhpSyntaxCheck = noPhpSyntaxCheck;
  }

  const noSingleQuote = config.get<boolean>("noSingleQuote");
  if (typeof noSingleQuote === "boolean") {
    options.noSingleQuote = noSingleQuote;
  }

  const noTrailingCommaPhp = config.get<boolean>("noTrailingCommaPhp");
  if (typeof noTrailingCommaPhp === "boolean") {
    options.noTrailingCommaPhp = noTrailingCommaPhp;
  }

  const extraLiners = sanitizeStringArray(config.get<string[]>("extraLiners"));
  if (extraLiners.length) {
    options.extraLiners = extraLiners;
  }

  const componentPrefix = sanitizeStringArray(config.get<string[]>("componentPrefix"));
  if (componentPrefix.length) {
    options.componentPrefix = componentPrefix;
  }

  const phpVersion = getStringSetting(config, "phpVersion");
  if (phpVersion) {
    options.phpVersion = phpVersion;
  }

  const runtimeConfigPath = getStringSetting(config, "runtimeConfigPath");
  if (runtimeConfigPath) {
    options.runtimeConfigPath = resolveWorkspacePath(runtimeConfigPath, document);
  }

  return options;
}

function getStringSetting(
  config: vscode.WorkspaceConfiguration,
  key: string
): string | undefined {
  const value = config.get<string>(key);
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function sanitizeStringArray(value: string[] | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function resolveWorkspacePath(value: string, document: vscode.TextDocument): string {
  if (path.isAbsolute(value)) {
    return value;
  }

  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!folder) {
    return value;
  }

  return path.join(folder.uri.fsPath, value);
}

type FormatRegion = {
  content: string;
  shouldFormat: boolean;
};

const DISABLE_MARKER_SOURCE = "\\{\\{--\\s*@disable-format\\s*--\\}\\}";
const ENABLE_MARKER_SOURCE = "\\{\\{--\\s*@enable-format\\s*--\\}\\}";

function splitByDisableMarkers(text: string): FormatRegion[] {
  const regions: FormatRegion[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const disableMatch = findMarker(DISABLE_MARKER_SOURCE, text, cursor);
    if (!disableMatch) {
      regions.push({ content: text.slice(cursor), shouldFormat: true });
      break;
    }

    if (disableMatch.index > cursor) {
      regions.push({
        content: text.slice(cursor, disableMatch.index),
        shouldFormat: true
      });
    }

    const disabledStart = disableMatch.index;
    const searchStart = disabledStart + disableMatch.length;
    const enableMatch = findMarker(ENABLE_MARKER_SOURCE, text, searchStart);
    const disabledEnd = enableMatch ? enableMatch.index + enableMatch.length : text.length;

    regions.push({
      content: text.slice(disabledStart, disabledEnd),
      shouldFormat: false
    });

    cursor = disabledEnd;
  }

  if (regions.length === 0) {
    regions.push({ content: text, shouldFormat: true });
  }

  return regions;
}

function findMarker(source: string, text: string, from: number): { index: number; length: number } | null {
  const regex = new RegExp(source, "g");
  regex.lastIndex = from;
  const match = regex.exec(text);
  if (!match) {
    return null;
  }

  return { index: match.index, length: match[0].length };
}

export function deactivate(): void {
  // no resources to clean up
}
