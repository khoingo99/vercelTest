// app/api/tickets/route.js
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export const runtime = "nodejs";

const ALLOWED_STATUS = ["NEW", "IN_PROGRESS", "DONE", "CANCELED"];
// GET /api/tickets?page=1&size=10&status=NEW
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const size = Math.min(50, Math.max(1, Number(url.searchParams.get("size") || 10)));
    const status = url.searchParams.get("status") || "ALL";
    const skip = (page - 1) * size;
    const where = status !== "ALL" ? { status } : {};
    const [items, total, grouped] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: size,
        orderBy: { id: "desc" },
        include: {
          author: { select: { username: true, name: true } },
        },
      }),
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const summary = { NEW: 0, IN_PROGRESS: 0, CANCELED: 0, DONE: 0 };
    grouped.forEach((g) => {
      if (summary[g.status] != null) summary[g.status] = g._count._all;
    });

    return NextResponse.json({ ok: true, items, page, size, total, summary });
  } catch (err) {
    console.error("Tickets GET error:", err);
    return NextResponse.json({ ok: false, message: "목록 조회에 실패했습니다." }, { status: 500 });
  }
}

// POST /api/tickets
export async function POST(req) {
  try {
    const form = await req.formData();
    const title = String(form.get("title") || "").trim();
    const category = String(form.get("category") || "").trim();
    const content = String(form.get("content") || "").trim();
    const authorUsername = String(form.get("authorUsername") || "").trim();
    const assigneeUsername = String(form.get("assigneeUsername") || "").trim();
    let status = String(form.get("status") || "NEW").trim();
    if (!ALLOWED_STATUS.includes(status)) status = "NEW";
    // ---- validate ----
    if (!title) return NextResponse.json({ ok: false, message: "제목은 필수입니다." }, { status: 400 });
    if (!category) return NextResponse.json({ ok: false, message: "업무 구분은 필수입니다." }, { status: 400 });
    if (!content) return NextResponse.json({ ok: false, message: "내용은 필수입니다." }, { status: 400 });
    if (!authorUsername) return NextResponse.json({ ok: false, message: "로그인 정보가 필요합니다." }, { status: 401 });
    const author = await prisma.user.findUnique({ where: { username: authorUsername } });
    if (!author) return NextResponse.json({ ok: false, message: "작성자를 찾을 수 없습니다." }, { status: 404 });
    //  attachments JSON from client
    let attachmentsData = [];
    const attachmentsRaw = form.get("attachments");
    if (attachmentsRaw) {
      try {
        const parsed = JSON.parse(String(attachmentsRaw));
        attachmentsData = Array.isArray(parsed) ? parsed : [];
      } catch {
        attachmentsData = [];
      }
    }
    attachmentsData = attachmentsData
      .filter((a) => a && typeof a.url === "string")
      .map((a) => ({
        name: String(a.name || "file"),
        url: String(a.url),
        size: Number(a.size || 0),
        mimetype: String(a.mimetype || "application/octet-stream"),
      }));

    const ticket = await prisma.ticket.create({
      data: {
        title,
        category,
        content,
        status,
        authorId: author.id,
        assigneeName: assigneeUsername || null,
        attachments: attachmentsData.length ? { create: attachmentsData } : undefined,
      },
      include: { attachments: true },
    });

    return NextResponse.json({ ok: true, ticket });
  } catch (err) {
    console.error("Tickets POST error:", err);
    return NextResponse.json({ ok: false, message: "등록에 실패했습니다." }, { status: 500 });
  }
}
