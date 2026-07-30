const Ajv = require("ajv");
const path = require("path");
const fs = require("fs");
const ts = require("typescript");
const { generateSchema } = require("./generate-schema");

const ajv = new Ajv();

console.log("Validating language files...");

// The English sentence is the key in every locale file.
const enJsonPath = path.join(__dirname, "..", "renderer", "locales", "en.json");
const enJson = JSON.parse(fs.readFileSync(enJsonPath, "utf-8"));

// Generate the schema for en.json
const enSchema = generateSchema(enJson);
const validate = ajv.compile(enSchema);

// Validate other language files
const localesDir = path.join(__dirname, "..", "renderer", "locales");
const languageFiles = fs
  .readdirSync(localesDir)
  .filter((file) => file !== "en.json");

const validationErrors = [];

// The English file is also a translation file, so its values must match its keys.
for (const [englishText, translation] of Object.entries(enJson)) {
  if (englishText !== translation) {
    validationErrors.push(
      `en.json must map ${JSON.stringify(englishText)} to itself.`,
    );
  }
}

const hasEnglishText = (englishText) =>
  Object.prototype.hasOwnProperty.call(enJson, englishText);

const rendererDir = path.join(__dirname, "..", "renderer");
const rendererFiles = [];

const collectRendererFiles = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectRendererFiles(filePath);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      rendererFiles.push(filePath);
    }
  }
};

collectRendererFiles(rendererDir);

const extractTranslationSources = (filePath) => {
  const sourceText = fs.readFileSync(filePath, "utf-8");
  if (
    !sourceText.includes("translationAtom") &&
    !sourceText.includes("useTranslation")
  ) {
    return [];
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const sources = [];

  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(sourceFile) === "t" &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      sources.push(node.arguments[0].text);
    }

    if (
      ts.isTaggedTemplateExpression(node) &&
      node.tag.getText(sourceFile) === "t" &&
      ts.isNoSubstitutionTemplateLiteral(node.template)
    ) {
      sources.push(node.template.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return sources;
};

for (const filePath of rendererFiles) {
  for (const source of extractTranslationSources(filePath)) {
    if (!hasEnglishText(source)) {
      validationErrors.push(
        `${path.relative(process.cwd(), filePath)} uses ${JSON.stringify(source)}, but that source text is missing from renderer/locales/en.json.`,
      );
    }
  }
}

languageFiles.forEach((file) => {
  const filePath = path.join(localesDir, file);
  const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const valid = validate(jsonData);

  if (!valid) {
    console.error(`Errors in ${file}:`);
    console.error(validate.errors);
    validationErrors.push(`${file} does not match the English locale schema.`);
  } else {
    console.log(`${file} is valid.`);
  }
});

if (validationErrors.length > 0) {
  console.error("\nTranslation validation errors:");
  for (const error of validationErrors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
}
