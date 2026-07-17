export const IMAGE_SCALE_PRESETS = ["1", "2", "4", "8", "16"] as const;

export const isImageScalePreset = (scale: string) =>
  IMAGE_SCALE_PRESETS.includes(scale as (typeof IMAGE_SCALE_PRESETS)[number]);

export const isValidImageScale = (scale: string) => {
  const value = Number(scale);

  return Number.isInteger(value) && value >= 1 && value <= 16;
};
