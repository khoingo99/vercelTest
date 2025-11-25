import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

// GET /api/tickets?page=1&size=10
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const size = Math.min(50, Math.max(1, Number(url.searchParams.get("size") || 10)));
    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        skip,
        take: size,
        orderBy: { id: "desc" },
        include: {
          author: {
            select: { username: true, name: true },
          },
          _count: {
            select: { files: true },   // để biết có bao nhiêu file đính kèm
          },
        },
      }),
      prisma.ticket.count(),
    ]);

    return NextResponse.json({
      ok: true,
      items,
      page,
      size,
      total,
    });
  } catch (err) {
    console.error("Tickets GET error:", err);
    return NextResponse.json(
      { ok: false, message: "목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// POST /api/tickets  (FormData)
const ALLOWED_STATUS = ["NEW", "IN_PROGRESS", "DONE", "CANCELED"];

export async function POST(req) {
  try {
    const form = await req.formData();

    const title = String(form.get("title") || "").trim();
    const category = String(form.get("category") || "").trim();
    const content = String(form.get("content") || "").trim();
    const authorUsername = String(form.get("authorUsername") || "").trim();

    const assigneeName = String(form.get("assigneeUsername") || "").trim();
    let status = String(form.get("status") || "NEW").trim();

    if (!ALLOWED_STATUS.includes(status)) {
      status = "NEW";
    }

    // validate
    if (!title) {
      return NextResponse.json(
        { ok: false, message: "제목은 필수입니다." },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { ok: false, message: "업무 구분은 필수입니다." },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { ok: false, message: "내용은 필수입니다." },
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

    // lấy tất cả files từ FormData
    const files = form.getAll("files").filter(Boolean);

    // tạo ticket trước
    const ticket = await prisma.ticket.create({
      data: {
        title,
        category,
        content,
        status,
        authorId: author.id,
        assigneeName: assigneeName || null,
      },
    });

    // lưu file (nếu có)
    if (files.length > 0) {
      const fileCreates = await Promise.all(
        files.map(async (f) => {
          // f là instance của File
          const arrayBuf = await f.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);

          return prisma.ticketFile.create({
            data: {
              ticketId: ticket.id,
              filename: f.name,
              mimeType: f.type || "application/octet-stream",
              size: f.size,
              data: buffer,
            },
          });
        })
      );
      // có thể trả kèm fileCreates nếu cần
    }

    return NextResponse.json({ ok: true, ticket });
  } catch (err) {
    console.error("Tickets POST error:", err);
    return NextResponse.json(
      { ok: false, message: "등록에 실패했습니다." },
      { status: 500 }
    );
  }
}