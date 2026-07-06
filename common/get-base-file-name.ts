export default function getBaseFileName(filename: string) {
  return filename.replace(/\.[^/.]+$/, "");
}
