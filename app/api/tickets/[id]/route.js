// app/api/tickets/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const ALLOWED_STATUS = ["NEW", "IN_PROGRESS", "DONE", "CANCELED"];
const uploadDir = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (e) {}
}

// GET /api/tickets/:id  (tăng view + trả chi tiết)
export async function GET(_req, { params }) {
  const { id: rawId } = await params;   // rawId = "1" nếu gọi /api/tickets/1
    console.log("[GET /api/tickets/:id] rawId =", rawId);

    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

  try {
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        author: {
          select: { username: true, name: true, phone: true },
        },
        attachments: true,
        comments: {
          orderBy: { id: "asc" },
          include: {
            author: {
              select: { username: true, name: true },
            },
          },
        }
      },
    });

    return NextResponse.json({ ok: true, data: ticket });
  } catch (err) {
    console.error("Ticket detail GET error:", err);
    return NextResponse.json(
      { ok: false, message: "요청을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
}

// PUT /api/tickets/:id  (FormData, giống POST nhưng có xoá/thêm file)
export async function PUT(req, { params }) {
  const { id: rawId } = await params;   // rawId = "1" nếu gọi /api/tickets/1
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

  try {
    const form = await req.formData();

    const title = String(form.get("title") || "").trim();
    const category = String(form.get("category") || "").trim();
    const content = String(form.get("content") || "").trim();
    const assigneeUsername = String(
      form.get("assigneeUsername") || ""
    ).trim();
    const authorUsername = String(
      form.get("authorUsername") || ""
    ).trim();

    let status = String(form.get("status") || "NEW").trim();
    if (!ALLOWED_STATUS.includes(status)) {
      status = "NEW";
    }

    if (!title || !category || !content) {
      return NextResponse.json(
        { ok: false, message: "제목/업무구분/내용은 필수입니다." },
        { status: 400 }
      );
    }

    // optional: check author, ticket tồn tại
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json(
        { ok: false, message: "요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!authorUsername) {
      // dùng để kiểm tra login
      return NextResponse.json(
        { ok: false, message: "로그인 정보가 필요합니다." },
        { status: 401 }
      );
    }

    // parse danh sách id file bị xoá
    let deletedAttachmentIds = [];
    const deletedRaw = form.get("deletedAttachmentIds");
    if (deletedRaw) {
      try {
        deletedAttachmentIds = JSON.parse(String(deletedRaw));
        if (!Array.isArray(deletedAttachmentIds)) {
          deletedAttachmentIds = [];
        }
      } catch {
        deletedAttachmentIds = [];
      }
    }

    // xử lý file mới
    // xử lý file mới (upload lên Vercel Blob)
const newFiles = form.getAll("files").filter(Boolean);

const attachmentsCreate = [];

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  return NextResponse.json(
    { ok: false, message: "BLOB_READ_WRITE_TOKEN missing (Vercel env / .env.local)" },
    { status: 500 }
  );
}

for (const f of newFiles) {
  const arrayBuf = await f.arrayBuffer();

  const safeOriginalName = (f.name || "file").replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const pathname =
    "tickets/" +
    id +
    "/" +
    Date.now().toString() +
    "_" +
    Math.random().toString(36).slice(2, 8) +
    "_" +
    safeOriginalName;

  const blob = await put(pathname, arrayBuf, {
    access: "public",
    contentType: f.type || "application/octet-stream",
    token: process.env.BLOB_READ_WRITE_TOKEN, // ✅ quan trọng
    addRandomSuffix: false,
  });

  attachmentsCreate.push({
    name: f.name || safeOriginalName,
    url: blob.url, // ✅ lưu URL blob
    size: typeof f.size === "number" ? f.size : arrayBuf.byteLength,
    mimetype: f.type || "application/octet-stream",
  });
}


    // build data update
    const dataToUpdate = {
      title,
      category,
      content,
      status,
      assigneeName: assigneeUsername || null,
    };

    // nested write: xoá + thêm file cùng lúc
    if (deletedAttachmentIds.length > 0 || attachmentsCreate.length > 0) {
      dataToUpdate.attachments = {};
      if (deletedAttachmentIds.length > 0) {
        dataToUpdate.attachments.deleteMany = {
          id: { in: deletedAttachmentIds },
        };
      }
      if (attachmentsCreate.length > 0) {
        dataToUpdate.attachments.create = attachmentsCreate;
      }
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: dataToUpdate,
      include: {
        author: { select: { username: true, name: true, phone: true } },
        attachments: true,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("Ticket PUT error:", err);
    return NextResponse.json(
      { ok: false, message: "수정에 실패했습니다." },
      { status: 500 }
    );
  }
}
