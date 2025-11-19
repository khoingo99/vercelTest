import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Thiếu email' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: true, posts: [] });
    }

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, posts });
  } catch (err) {
    console.error('Get posts error:', err);
    return NextResponse.json(
      { success: false, message: 'Lấy bài viết thất bại' },
      { status: 500 }
    );
  }
}
