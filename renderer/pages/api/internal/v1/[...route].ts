import type { NextApiRequest, NextApiResponse } from "next";
import { handleUpscaleInternalApiV1 } from "@/server/upscale-api/internal-handler";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleUpscaleInternalApiV1(req, res);
}
