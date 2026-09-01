import { accessSync, constants, existsSync, readdirSync } from "fs";
import { join } from "path";

type SoftwareVulkanMode = "auto" | "always" | "never";

const softwareDriverPattern = /(llvmpipe|lavapipe|lvp)/i;

const normalizeSoftwareVulkanMode = (
  value: string | undefined,
): SoftwareVulkanMode => {
  if (value === "always" || value === "true" || value === "1") {
    return "always";
  }
  if (value === "never" || value === "false" || value === "0") {
    return "never";
  }
  return "auto";
};

const canAccess = (path: string, mode = constants.R_OK) => {
  try {
    accessSync(path, mode);
    return true;
  } catch {
    return false;
  }
};

const hasAccessibleRenderNode = () => {
  const renderDir = "/dev/dri";
  if (!existsSync(renderDir)) return false;
  try {
    return readdirSync(renderDir).some(
      (entry) =>
        entry.startsWith("renderD") &&
        canAccess(join(renderDir, entry), constants.R_OK | constants.W_OK),
    );
  } catch {
    return false;
  }
};

const findLavapipeIcdPath = () => {
  const explicitPath = process.env.UPSCAYL_API_LAVAPIPE_ICD_PATH;
  if (explicitPath && canAccess(explicitPath)) return explicitPath;

  const icdDirs = [
    "/usr/share/vulkan/icd.d",
    "/usr/local/share/vulkan/icd.d",
    "/etc/vulkan/icd.d",
  ];
  for (const dir of icdDirs) {
    if (!existsSync(dir)) continue;
    try {
      const match = readdirSync(dir).find((entry) =>
        /lvp.*\.json$/i.test(entry),
      );
      if (match) return join(dir, match);
    } catch {
      // Try the next standard ICD directory.
    }
  }
  return null;
};

export const getSoftwareVulkanInfo = () => {
  const mode = normalizeSoftwareVulkanMode(
    process.env.UPSCAYL_API_SOFTWARE_VULKAN,
  );
  const preset =
    softwareDriverPattern.test(process.env.VK_ICD_FILENAMES || "") ||
    softwareDriverPattern.test(process.env.MESA_LOADER_DRIVER_OVERRIDE || "") ||
    process.env.LIBGL_ALWAYS_SOFTWARE === "1";

  if (mode === "never") {
    return { mode, active: false, reason: "disabled" };
  }
  if (process.platform !== "linux") {
    return { mode, active: false, reason: "unsupported_platform" };
  }
  if (mode === "always") {
    return {
      mode,
      active: true,
      reason: "forced",
      icdPath: findLavapipeIcdPath(),
    };
  }
  if (preset) {
    return {
      mode,
      active: true,
      reason: "preset_environment",
      icdPath: findLavapipeIcdPath(),
    };
  }
  if (!hasAccessibleRenderNode()) {
    return {
      mode,
      active: true,
      reason: "no_accessible_render_node",
      icdPath: findLavapipeIcdPath(),
    };
  }
  return { mode, active: false, reason: "hardware_render_node_available" };
};

export const buildUpscaylSpawnEnv = () => {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const softwareVulkan = getSoftwareVulkanInfo();
  if (!softwareVulkan.active) return env;

  if (!env.LIBGL_ALWAYS_SOFTWARE) env.LIBGL_ALWAYS_SOFTWARE = "1";
  if (!env.MESA_LOADER_DRIVER_OVERRIDE) {
    env.MESA_LOADER_DRIVER_OVERRIDE = "llvmpipe";
  }
  if (!env.VK_ICD_FILENAMES && softwareVulkan.icdPath) {
    env.VK_ICD_FILENAMES = softwareVulkan.icdPath;
  }
  env.UPSCAYL_API_SOFTWARE_VULKAN_ACTIVE = "true";
  return env;
};
