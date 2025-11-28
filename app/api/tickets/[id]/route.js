import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// GET /api/tickets/:id
export async function GET(_req, { params }) {
  try {
    // ⬇⬇⬇  CHỈ DÙNG `await params`, KHÔNG DÙNG `params.id` TRỰC TIẾP
    const { id: rawId } = await params;   // rawId = "1" nếu gọi /api/tickets/1
    console.log("[GET /api/tickets/:id] rawId =", rawId);

    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    // Lấy ticket (chỉ include những quan hệ chắc chắn đang tồn tại trong schema)
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        author: {
          select: { username: true, name: true, phone: true },
        },
        attachments: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            name: true,
            url: true,
            size: true,
            mimetype: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) {
          return NextResponse.json(
            { ok: false, message: "요청을 찾을 수 없습니다." },
            { status: 404 }
          );
        }
    try {
      await prisma.ticket.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    } catch (e) {
      console.warn("Increase views failed:", e);
    }
    return NextResponse.json({ ok: true, data: ticket });
    
  } catch (err) {
    console.error("[GET /api/tickets/:id] error", err);
    return NextResponse.json(
      { ok: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}