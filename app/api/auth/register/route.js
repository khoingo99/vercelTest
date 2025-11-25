import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      username,
      email,
      name,
      phone,
      password,
      department,
      position,
    } = body;

    // ----- validate password theo rule -----
    // 8~16 ký tự, có ít nhất: 1 chữ cái, 1 số, 1 ký tự đặc biệt
    const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/;

    if (!pwRegex.test(password || "")) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "비밀번호는 영문자, 숫자, 특수문자를 포함하여 8자에서 16자까지 입력해주세요.",
        },
        { status: 400 }
      );
    }
    // ---------------------------------------

    // (các validate khác: username, email…)
    if (!username || !email) {
      return NextResponse.json(
        { ok: false, message: "아이디와 이메일은 필수입니다." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          return NextResponse.json(
            { success: false, message: '이미 사용 중인 아이디 또는 이메일입니다.' },
            { status: 400 }
          );
        }
    if (!department || !department.trim() || !position || !position.trim()) {
      return NextResponse.json(
        { ok: false, message: "부서와 직위는 필수입니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        name,
        phone,
        password: password,
        department: department,
        position: position,
      },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { ok: false, message: "회원가입에 실패했습니다." },
      { status: 500 }
    );
  }
}