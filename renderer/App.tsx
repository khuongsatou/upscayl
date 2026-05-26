import AppProviders from "./app-providers";
import RendererErrorBoundary from "./error-boundary";
import Home from "./home";
import { TanStackDevtools } from "@tanstack/react-devtools";

const App = () => {
  return (
    <RendererErrorBoundary>
      <AppProviders>
        <Home />
        <TanStackDevtools
          config={{
            inspectHotkey: ["Alt"],
            sourceAction: "ide-warp",
          }}
        />
      </AppProviders>
    </RendererErrorBoundary>
  );
};

export default App;
