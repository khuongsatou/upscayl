import { libraryItemsAtom } from "@/atoms/user-settings-atom";
import { translationAtom } from "@/atoms/translations-atom";
import { getRuntimeFileName } from "@/lib/app-runtime";
import { toImageSrc } from "@/lib/image-src";
import { Eye, ExternalLink, Trash2 } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";

const getDisplayName = (path: string) => {
  const name = getRuntimeFileName(path);
  return name.split(/[\\/]/).pop() || name || "image";
};

function LibraryTab({
  onShowInViewer,
}: {
  onShowInViewer: (imagePath: string, resultPath?: string) => void;
}) {
  const t = useAtomValue(translationAtom);
  const [items, setItems] = useAtom(libraryItemsAtom);

  return (
    <div className="flex h-screen flex-col gap-4 overflow-y-auto overflow-x-hidden p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold uppercase">{t("LIBRARY.TITLE")}</p>
          <p className="text-xs text-base-content/70">
            {t("LIBRARY.SUMMARY", { count: items.length.toString() })}
          </p>
        </div>
        <button
          className="btn btn-square btn-ghost btn-sm"
          disabled={items.length === 0}
          onClick={() => setItems([])}
          title={t("LIBRARY.CLEAR")}
          aria-label={t("LIBRARY.CLEAR")}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-base-300 bg-base-200 p-4 text-sm text-base-content/70">
          {t("LIBRARY.EMPTY")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-lg border border-base-300 bg-base-200">
              <button
                className="block h-32 w-full bg-base-100 p-1"
                onClick={() => onShowInViewer(item.imagePath, item.resultPath)}
                title={t("LIBRARY.VIEW")}
              >
                <img src={toImageSrc(item.resultPath || item.imagePath)} alt={item.name} className="h-full w-full object-contain" />
              </button>
              <div className="p-2">
                <p className="truncate text-xs font-medium" title={item.name}>{getDisplayName(item.resultPath || item.name)}</p>
                <div className="mt-1 flex justify-end gap-1">
                  <button className="btn btn-square btn-ghost btn-xs" onClick={() => onShowInViewer(item.imagePath, item.resultPath)} title={t("LIBRARY.VIEW")} aria-label={t("LIBRARY.VIEW")}><Eye size={13} /></button>
                  {item.resultPath && <button className="btn btn-square btn-ghost btn-xs" onClick={() => window.open(item.resultPath, "_blank")} title={t("QUEUE.OPEN_RESULT")} aria-label={t("QUEUE.OPEN_RESULT")}><ExternalLink size={13} /></button>}
                  <button className="btn btn-square btn-ghost btn-xs" onClick={() => setItems((previous) => previous.filter((entry) => entry.id !== item.id))} title={t("LIBRARY.REMOVE")} aria-label={t("LIBRARY.REMOVE")}><Trash2 size={13} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default LibraryTab;
