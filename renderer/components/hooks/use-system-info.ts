import { useEffect, useState } from "react";
import { appRuntime } from "@/lib/app-runtime";

const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<Awaited<
    ReturnType<typeof appRuntime.getSystemInfo>
  > | null>(null);

  useEffect(() => {
    const getSystemInfo = async () => {
      const systemInfo = await appRuntime.getSystemInfo();
      setSystemInfo(systemInfo);
    };
    getSystemInfo();
  }, []);
  return { systemInfo };
};

export default useSystemInfo;
