import { translationAtom } from "@/atoms/translations-atom";
import {
  localMacApiEndpointAtom,
  useLocalMacProcessingAtom,
} from "@/atoms/user-settings-atom";
import { useAtom, useAtomValue } from "jotai";

const LocalMacProcessingToggle = () => {
  const [useLocalMacProcessing, setUseLocalMacProcessing] = useAtom(
    useLocalMacProcessingAtom,
  );
  const [localMacApiEndpoint, setLocalMacApiEndpoint] = useAtom(
    localMacApiEndpointAtom,
  );
  const t = useAtomValue(translationAtom);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {t("SETTINGS.LOCAL_MAC_PROCESSING.TITLE")}
      </p>
      <p className="text-xs text-base-content/80">
        {t("SETTINGS.LOCAL_MAC_PROCESSING.DESCRIPTION")}
      </p>
      <input
        type="checkbox"
        className="toggle"
        checked={useLocalMacProcessing}
        onClick={() => setUseLocalMacProcessing((prev) => !prev)}
      />
      {useLocalMacProcessing && (
        <input
          className="input input-bordered input-sm font-mono text-xs"
          value={localMacApiEndpoint}
          onChange={(event) => setLocalMacApiEndpoint(event.target.value)}
          placeholder="http://127.0.0.1:3047/upscale/api/v1"
        />
      )}
    </div>
  );
};

export default LocalMacProcessingToggle;
