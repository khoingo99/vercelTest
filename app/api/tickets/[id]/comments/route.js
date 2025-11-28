import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

// POST /api/tickets/:id/comments
export async function POST(req, { params }) {
  try {
    
    const { id: rawId } = await params;   // rawId = "1" nếu gọi /api/tickets/1
    console.log("[GET /api/tickets/:id] rawId =", rawId);

    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const content = String(body.content || "").trim();
    const username = String(body.username || "").trim(); // lấy từ localStorage

    if (!content) {
      return NextResponse.json(
        { ok: false, message: "댓글 내용을 입력하세요." },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        ticketId: id,
        authorId: user.id,
        content,
      },
      include: {
        author: {
          select: { username: true, name: true },
        },
      },
    });

    return NextResponse.json({ ok: true, data: comment });
  } catch (err) {
    console.error("Comment POST error:", err);
    return NextResponse.json(
      { ok: false, message: "댓글 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
