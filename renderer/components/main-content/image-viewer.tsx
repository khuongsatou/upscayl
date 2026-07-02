import { cn } from "@/lib/utils";
import { sanitizePath } from "@common/sanitize-path";

const ImageViewer = ({
  imagePath,
  setDimensions,
  className,
}: {
  imagePath: string;
  setDimensions: (dimensions: { width: number; height: number }) => void;
  className?: string;
}) => {
  return (
    <img
      src={"file:///" + sanitizePath(imagePath)}
      onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
        setDimensions({
          width: e.currentTarget.naturalWidth,
          height: e.currentTarget.naturalHeight,
        });
      }}
      draggable="false"
      alt=""
      className={cn(
        "bg-base size-full bg-linear-to-br object-contain",
        className,
      )}
    />
  );
};

export default ImageViewer;
