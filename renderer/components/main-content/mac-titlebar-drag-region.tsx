const MacTitlebarDragRegion = () => {
  return window.electron.platform === "mac" ? (
    <div className="mac-titlebar fixed top-0 z-50 h-8 w-full"></div>
  ) : null;
};

export default MacTitlebarDragRegion;
