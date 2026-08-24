import type { NextApiRequest, NextApiResponse } from "next";
import { handleUpscaleApiV1 } from "@/server/upscale-api/handler";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleUpscaleApiV1(req, res);
}
