// app/api/tickets/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export const runtime = "nodejs";
const ALLOWED_STATUS = ["NEW", "IN_PROGRESS", "DONE", "CANCELED"];

// GET /api/tickets/:id 
export async function GET(_req, { params }) {
  const { id: rawId } = await params;
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
        author: { select: { username: true, name: true, phone: true } },
        attachments: true,
        comments: {
          orderBy: { id: "asc" },
          include: {
            author: { select: { username: true, name: true } },
          },
        },
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
// PUT /api/tickets/:id 
export async function PUT(req, { params }) {
 const { id: rawId } = await params;
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
    const assigneeUsername = String(form.get("assigneeUsername") || "").trim();
    const authorUsername = String(form.get("authorUsername") || "").trim();

    let status = String(form.get("status") || "NEW").trim();
    if (!ALLOWED_STATUS.includes(status)) status = "NEW";
    if (!title || !category || !content) {
      return NextResponse.json(
        { ok: false, message: "제목/업무구분/내용은 필수입니다." },
        { status: 400 }
      );
    }

    if (!authorUsername) {
      return NextResponse.json(
        { ok: false, message: "로그인 정보가 필요합니다." },
        { status: 401 }
      );
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json(
        { ok: false, message: "요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    // deletedAttachmentIds
    let deletedAttachmentIds = [];
    const deletedRaw = form.get("deletedAttachmentIds");
    if (deletedRaw) {
      try {
        const arr = JSON.parse(String(deletedRaw));
        deletedAttachmentIds = Array.isArray(arr) ? arr : [];
      } catch {
        deletedAttachmentIds = [];
      }
    }
    // attachments (new uploaded)
    let attachmentsCreate = [];
    const attachmentsRaw = form.get("attachments");
    if (attachmentsRaw) {
      try {
        const parsed = JSON.parse(String(attachmentsRaw));
        attachmentsCreate = Array.isArray(parsed) ? parsed : [];
      } catch {
        attachmentsCreate = [];
      }
    }
    // sanitize
    attachmentsCreate = attachmentsCreate
      .filter((a) => a && typeof a.url === "string")
      .map((a) => ({
        name: String(a.name || "file"),
        url: String(a.url),
        size: Number(a.size || 0),
        mimetype: String(a.mimetype || "application/octet-stream"),
      }));

    const dataToUpdate = {
      title,
      category,
      content,
      status,
      assigneeName: assigneeUsername || null,
    };

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