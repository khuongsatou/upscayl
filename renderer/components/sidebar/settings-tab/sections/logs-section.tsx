import React, { useState } from "react";
import { LogArea } from "../log-area";

interface IProps {
  logData: string[];
}

function LogsSection({ logData }: IProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyOnClickHandler = () => {
    navigator.clipboard.writeText(logData.join("\n"));
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const sendToTermbin = async (logData: string[]) => {
    try {
      const response = await fetch("https://termbin.com:9999/", {
        method: "POST",
        body: logData.join("\n"),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const url = await response.text();
      return url.trim();
    } catch (error) {
      console.error("Error sending to termbin:", error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <LogArea
        copyOnClickHandler={copyOnClickHandler}
        isCopied={isCopied}
        logData={logData}
      />
    </div>
  );
}

export default LogsSection;