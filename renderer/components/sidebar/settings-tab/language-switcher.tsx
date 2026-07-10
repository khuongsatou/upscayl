import { localeAtom, translationAtom } from "@/atoms/translations-atom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

const locales = {
  ar: "العربية",
  en: "English",
  tr: "Türkçe",
  ru: "Русский",
  uk: "Українська",
  ja: "日本語",
  zh: "简体中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  vi: "Tiếng Việt",
  pt: "Português (Portugal)",
  ptBR: "Português (Brasil)",
  id: "Bahasa Indonesia",
  caVAL: "Català (Valencià)",
  hu: "Magyar",
  pl: "Polski",
};

const LanguageSwitcher = ({ hideLabel = false }: { hideLabel?: boolean }) => {
  const [locale, setLocale] = useAtom(localeAtom);
  const t = useAtomValue(translationAtom);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        {!hideLabel && (
          <p className="text-sm font-medium">{t("SETTINGS.LANGUAGE.TITLE")}</p>
        )}
        <Select
          value={locale}
          onValueChange={(value) => setLocale(value as keyof typeof locales)}
        >
          <SelectTrigger size="sm" className="min-w-50">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>

          <SelectContent>
            {Object.entries(locales)
              .sort(([, a], [, b]) => a.localeCompare(b))
              .map(([locale, label]) => (
                <SelectItem key={locale} value={locale}>
                  {label.toUpperCase()}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
