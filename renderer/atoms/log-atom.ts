import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const logAtom = atomWithStorage<string[]>("upscayl-log-manager", []);
