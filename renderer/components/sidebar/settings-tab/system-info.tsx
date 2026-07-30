import useSystemInfo from "@/components/hooks/use-system-info";
import useTranslation from "@/components/hooks/use-translation";
import { cn } from "@/lib/utils";
import {
  MonitorSmartphone,
  GitBranch,
  Cpu,
  CircuitBoard,
  Layers,
  Gamepad2,
  InfoIcon,
} from "lucide-react";
import React from "react";

const systemInfoIcons = {
  platform: MonitorSmartphone,
  release: GitBranch,
  arch: Cpu,
  model: CircuitBoard,
  cpuCount: Layers,
  gpu: Gamepad2,
};

const SystemInfoRow = ({ icon: Icon, label, value }) => {
  const isObject = typeof value === "object" && value !== null;

  return (
    <div
      // className={isObject ? "py-2" : "flex items-center justify-between py-1.5"}
      className={cn("flex items-center justify-between py-1.5", {
        "items-start text-end": isObject,
      })}
    >
      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        {Icon ? <Icon className="size-4" /> : <InfoIcon className="size-4" />}
        <span className="capitalize">{label}</span>
      </div>

      {isObject ? (
        <div className="flex flex-col text-sm">
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey} className="inline-flex justify-end gap-1">
              <p className="capitalize">{subKey}:</p>
              <p className="font-mono text-sm font-medium">
                {subValue as string}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-mono text-xs font-medium">{value}</p>
      )}
    </div>
  );
};

const SystemInfo = () => {
  const { systemInfo } = useSystemInfo();
  const t = useTranslation();

  if (!systemInfo) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-sm font-medium">{t("SETTINGS.SYSTEM_INFO.TITLE")}</p>
      <div className="flex flex-col rounded-xl border bg-card p-4 text-xs">
        {Object.keys(systemInfo || {}).map((key) => {
          return (
            <SystemInfoRow
              key={key}
              icon={systemInfoIcons[key]}
              label={key}
              value={systemInfo[key]}
            />
          );
        })}
        {/* {Object.keys(systemInfo || {}).map((key) => ( */}
        {/*   <div key={key} className="flex flex-col"> */}
        {/*     <p className="font-mono capitalize">{key}:</p> */}
        {/*     {typeof systemInfo[key] === "object" ? ( */}
        {/*       <div className="ml-2"> */}
        {/*         {Object.keys(systemInfo[key]).map((subKey) => ( */}
        {/*           <div key={subKey} className="flex flex-row gap-1"> */}
        {/*             <p className="font-mono">{subKey}:</p> */}
        {/*             <p className="font-mono font-semibold"> */}
        {/*               {systemInfo[key][subKey]} */}
        {/*             </p> */}
        {/*           </div> */}
        {/*         ))} */}
        {/*       </div> */}
        {/*     ) : ( */}
        {/*       <p className="font-mono font-semibold">{systemInfo[key]}</p> */}
        {/*     )} */}
        {/*   </div> */}
        {/* ))} */}
      </div>
    </div>
  );
};

export default SystemInfo;
