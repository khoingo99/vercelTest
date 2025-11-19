import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

// GET /api/tickets?page=1&size=10
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const size = Math.max(1, Number(url.searchParams.get("size") || 10));
    const skip = (page - 1) * size;

    const [items, total, grouped] = await Promise.all([
      prisma.ticket.findMany({
        skip,
        take: size,
        orderBy: { id: "desc" },
        include: {
          author: { select: { username: true, name: true } },
          assignee: { select: { username: true, name: true } },
        },
      }),
      prisma.ticket.count(),
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    const summary = {};
    grouped.forEach((g) => {
      summary[g.status] = g._count.status;
    });

    return NextResponse.json({
      ok: true,
      data: {
        page,
        size,
        total,
        items,
        summary,
      },
    });
  } catch (err) {
    console.error("Tickets GET error:", err);
    return NextResponse.json(
      { ok: false, message: "목록 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/tickets  (FormData)
export async function POST(req) {
  try {
    const form = await req.formData();
    const type = String(form.get("type") || "OTHER");
    const title = String(form.get("title") || "").trim();
    const content = String(form.get("content") || "");
    const authorUsername = String(form.get("authorUsername") || "");

    if (!title) {
      return NextResponse.json(
        { ok: false, message: "제목은 필수입니다." },
        { status: 400 }
      );
    }

    if (!authorUsername) {
      return NextResponse.json(
        { ok: false, message: "로그인 정보가 필요합니다." },
        { status: 401 }
      );
    }

    const author = await prisma.user.findUnique({
      where: { username: authorUsername },
    });

    if (!author) {
      return NextResponse.json(
        { ok: false, message: "작성자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // files: hiện chưa lưu, bạn muốn thì thêm bảng Attachment sau
    const ticket = await prisma.ticket.create({
      data: {
        title,
        content,
        type,            // Prisma tự map với enum TicketType
        status: "NEW",
        authorId: author.id,
      },
    });

    return NextResponse.json({ ok: true, ticket });
  } catch (err) {
    console.error("Tickets POST error:", err);
    return NextResponse.json(
      { ok: false, message: "등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
