import { atom } from "jotai";
import ar from "../locales/ar.json";
import en from "../locales/en.json";
import tr from "../locales/tr.json";
import ru from "../locales/ru.json";
import uk from "../locales/uk.json";
import ja from "../locales/ja.json";
import zh from "../locales/zh.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import de from "../locales/de.json";
import vi from "../locales/vi.json";
import id from "../locales/id.json";
import pt from "../locales/pt.json";
import ptBR from "../locales/pt-br.json";
import caVAL from "../locales/ca-val.json";
import hu from "../locales/hu.json";
import pl from "../locales/pl.json";
import { atomWithStorage } from "jotai/utils";

type LanguageCode =
  | "ar"
  | "en"
  | "tr"
  | "ru"
  | "uk"
  | "ja"
  | "zh"
  | "es"
  | "fr"
  | "de"
  | "vi"
  | "pt"
  | "ptBR"
  | "id"
  | "caVAL"
  | "hu"
  | "pl";

type LanguageFile = Record<string, string>;

// Each file is a simple map: "English text" -> "translated text".
const translationsByLanguage: Record<LanguageCode, LanguageFile> = {
  ar,
  en,
  tr,
  ru,
  uk,
  ja,
  zh,
  es,
  fr,
  de,
  vi,
  id,
  pt,
  ptBR,
  caVAL,
  hu,
  pl,
};

// Values are used for text with placeholders, for example {name}.
export type TranslationValues = Record<string, unknown>;

// These two signatures allow both t("Select Image") and t`Select Image`.
type Translator = {
  (englishText: string, values?: TranslationValues): string;
  (template: TemplateStringsArray): string;
};

// Replace placeholders after the sentence has been translated.
const replacePlaceholders = (text: string, values: TranslationValues): string =>
  Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    text,
  );

// Return a function that translates readable English text for one language.
const createTranslator = (languageFile: LanguageFile): Translator => {
  function translate(englishText: string, values?: TranslationValues): string;
  function translate(template: TemplateStringsArray): string;
  function translate(
    englishTextOrTemplate: string | TemplateStringsArray,
    values: TranslationValues = {},
  ): string {
    if (typeof englishTextOrTemplate === "string") {
      const translatedText =
        languageFile[englishTextOrTemplate] ?? englishTextOrTemplate;

      // Show the original English sentence when a translation is missing.
      return replacePlaceholders(translatedText, values);
    }

    // Tagged templates are intended for simple, static sentences.
    const englishText = englishTextOrTemplate[0];
    return languageFile[englishText] ?? englishText;
  }

  return translate;
};

// Remember the selected language between app launches.
export const localeAtom = atomWithStorage<LanguageCode>("language", "en");

export const translationAtom = atom((get) => {
  const language = get(localeAtom);

  // When the language changes, Jotai creates a translator for that language.
  return createTranslator(translationsByLanguage[language]);
});
