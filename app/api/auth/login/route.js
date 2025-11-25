import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();
    const identifier = username || email;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "아이디 / 이메일과 비밀번호는 필수입니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, message: "로그인에 실패했습니다." },
      { status: 500 }
    );
  }
}
