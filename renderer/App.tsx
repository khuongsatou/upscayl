import Providers from "./providers";
import MacTitlebarDragRegion from "./components/main-content/mac-titlebar-drag-region";
import RendererErrorBoundary from "./error-boundary";
import Home from "./home";
import "./styles/globals.css";

const App = () => {
  return (
    <RendererErrorBoundary>
      <Providers>
        <MacTitlebarDragRegion />
        <Home />
        {/* <TanStackDevtools
          config={{
            inspectHotkey: ["Alt"],
            sourceAction: "ide-warp",
          }}
        /> */}
      </Providers>
    </RendererErrorBoundary>
  );
};

export default App;
