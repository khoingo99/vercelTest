import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(req) {
  try {
    const { username, name, email, phone, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: "아이디, 이메일, 비밀번호는 필수입니다." },
        { status: 400 }
      );
    }

    const existed = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existed) {
      return NextResponse.json(
        { success: false, message: "이미 사용중인 아이디 또는 이메일입니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: { username, email, name, phone, password }, // demo: chưa hash pass
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email, name },
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { success: false, message: "회원가입에 실패했습니다." },
      { status: 500 }
    );
  }
}
