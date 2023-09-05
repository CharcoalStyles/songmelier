import { NextRequest, NextResponse } from "next/server";

import fs from "fs";
import path from "path";

// export const runtime = "edge";

export async function GET() {
  const dirRelativeToPublicFolder = "test";

  const dir = path.resolve("./public", dirRelativeToPublicFolder);

  const filenames = fs.readdirSync(dir);
  const data = fs.readFileSync(path.join(dir, filenames[0]));

  console.log("data", data);

  return new Response(data, {
    headers: {
      "content-type": "audio/mpeg",
    },
  });
}
