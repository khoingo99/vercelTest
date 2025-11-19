import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Sai email hoặc mật khẩu' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, message: 'Đăng nhập thất bại' },
      { status: 500 }
    );
  }
}
