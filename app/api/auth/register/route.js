import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Email đã tồn tại' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        password, // Demo: không hash, KHÔNG dùng cho production
        name: name || email,
      },
    });

    // Tạo 2 bài viết demo cho user mới
    await prisma.post.createMany({
      data: [
        {
          title: 'Bài viết demo 1',
          content: 'Nội dung demo bài viết 1.',
          authorId: user.id,
        },
        {
          title: 'Bài viết demo 2',
          content: 'Nội dung demo bài viết 2.',
          authorId: user.id,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { success: false, message: 'Đăng ký thất bại' },
      { status: 500 }
    );
  }
}
