// app/api/tickets/route.js
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import fs from "fs/promises";
import path from "path";

// Các trạng thái cho phép
const ALLOWED_STATUS = ["NEW", "IN_PROGRESS", "DONE", "CANCELED"];

// Thư mục upload trong /public/uploads
const uploadDir = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (e) {
    // nếu đã tồn tại thì bỏ qua
  }
}

/**
 * GET /api/tickets?page=1&size=10&status=NEW
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);

    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const size = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("size") || 10))
    );

    const status = url.searchParams.get("status") || "ALL";
    const skip = (page - 1) * size;

    // ✅ điều kiện lọc theo trạng thái (nếu không phải ALL)
    const where =
      status !== "ALL"
        ? {
            status, // NEW | IN_PROGRESS | DONE | CANCELED
          }
        : {};

    const [items, total, grouped] = await Promise.all([
      prisma.ticket.findMany({
        where,           // ✅ áp dụng filter
        skip,
        take: size,
        orderBy: { id: "desc" },
        include: {
          author: {
            select: { username: true, name: true },
          },
        },
      }),

      // ✅ total sau khi lọc (dùng cho pagination)
      prisma.ticket.count({ where }),

      // ✅ summary cho TOÀN BỘ ticket (không truyền where)
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    // build summary chung cho 4 ô
    const summary = {
      NEW: 0,
      IN_PROGRESS: 0,
      CANCELED: 0,
      DONE: 0,
    };

    grouped.forEach((g) => {
      if (summary[g.status] != null) {
        summary[g.status] = g._count._all;
      }
    });

    return NextResponse.json({
      ok: true,
      items,
      page,
      size,
      total,     // ✅ total theo filter
      summary,   // ✅ tổng toàn bộ ticket
    });
  } catch (err) {
    console.error("Tickets GET error:", err);
    return NextResponse.json(
      { ok: false, message: "목록 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets
 * Body: FormData
 *  - title, category, content, authorUsername
 *  - assigneeUsername (optional)
 *  - status (NEW / IN_PROGRESS / DONE / CANCELED, optional)
 *  - files: nhiều file
 */
export async function POST(req) {
  try {
    const form = await req.formData();

    const title = String(form.get("title") || "").trim();
    const category = String(form.get("category") || "").trim();
    const content = String(form.get("content") || "").trim();
    const authorUsername = String(form.get("authorUsername") || "").trim();
    const assigneeUsername = String(
      form.get("assigneeUsername") || ""
    ).trim();

    let status = String(form.get("status") || "NEW").trim();
    if (!ALLOWED_STATUS.includes(status)) {
      status = "NEW";
    }

    // ---- validate ----
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
    // ------------------

    await ensureUploadDir();

    const files = form.getAll("files").filter(Boolean);

    // chuẩn bị data attachments để create
    const attachmentsData = [];

    for (const f of files) {
      // f là instance File
      const arrayBuf = await f.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      // tên file an toàn
      const safeOriginalName = (f.name || "file").replace(
        /[^a-zA-Z0-9.\-_]/g,
        "_"
      );
      const filename =
        Date.now().toString() +
        "_" +
        Math.random().toString(36).slice(2, 8) +
        "_" +
        safeOriginalName;

      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);

      const url = "/uploads/" + filename; // đường dẫn public

      attachmentsData.push({
        name: f.name || safeOriginalName,
        url,
        size: typeof f.size === "number" ? f.size : buffer.length,
        mimetype: f.type || "application/octet-stream",
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        category,
        content,
        status,
        authorId: author.id,
        assigneeName: assigneeUsername || null,
        attachments:
          attachmentsData.length > 0
            ? { create: attachmentsData }
            : undefined,
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json({ ok: true, ticket });
  } catch (err) {
    console.error("Tickets POST error:", err);
    return NextResponse.json(
      { ok: false, message: "등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
