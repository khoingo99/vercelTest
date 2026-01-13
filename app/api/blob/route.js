import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

export const runtime = "nodejs";

export async function POST(req) {
  const body = await req.json();

  try {
    const result = await handleUpload({
      request: req,
      body,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        return {
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          allowedContentTypes: [
           "image/*",
            "application/pdf",
            "application/zip",

            // Office
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",       // .xlsx
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",// .pptx
            "application/msword",                                                      // .doc
            "application/vnd.ms-excel",                                                // .xls
            "application/vnd.ms-powerpoint",                      
          ],
        };
      },

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // optional: log / update DB
        // console.log("Upload done:", blob.url);
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Upload failed" },
      { status: 400 }
    );
  }
}
