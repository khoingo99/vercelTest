// app/api/auth/profile/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/auth/profile?id=123
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { ok: false, message: "잘못된 요청입니다." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      position: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, user });
}

// PUT /api/auth/profile
export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      email,
      phone,
      department,
      position,
      currentPassword,
      newPassword,
    } = body;

    const userId = Number(id);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { ok: false, message: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const dataToUpdate = {
      name: name?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      department: department?.trim() || null,
      position: position?.trim() || null,
    };

    // nếu có nhập newPassword ⇒ bắt buộc phải có currentPassword và validate
    if (newPassword && newPassword.trim().length > 0) {
      if (!currentPassword) {
        return NextResponse.json(
          { ok: false, message: "현재 비밀번호를 입력해주세요." },
          { status: 400 }
        );
      }

     
      if ( currentPassword !== user.password) {
        return NextResponse.json(
          { ok: false, message: "현재 비밀번호가 올바르지 않습니다." },
          { status: 400 }
        );
      }

      const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/;
      if (!pwRegex.test(newPassword)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "비밀번호는 영문자, 숫자, 특수문자를 포함하여 8자에서 16자까지 입력해주세요.",
          },
          { status: 400 }
        );
      }

      dataToUpdate.password = newPassword;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { ok: false, message: "회원정보 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}
