import { Provider } from "jotai";
import "react-tooltip/dist/react-tooltip.css";
import { Toaster } from "@/components/ui/toaster";
import { Tooltip } from "react-tooltip";
import PostHogProviderWrapper from "@/components/posthog-provider-wrapper";
import { TooltipProvider } from "./components/ui/tooltip";
import ThemeProvider from "./components/theme/theme-provider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider>
      <ThemeProvider>
        <PostHogProviderWrapper>
          <TooltipProvider>
            {children}
            <Toaster />
            <Tooltip
              className="z-999 max-w-sm bg-secondary! wrap-break-word"
              id="tooltip"
            />
          </TooltipProvider>
        </PostHogProviderWrapper>
      </ThemeProvider>
    </Provider>
  );
};

export default Providers;
