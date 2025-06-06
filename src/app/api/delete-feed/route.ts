import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/client"; // Prisma Client import

export async function POST(req: NextRequest) {
  const { feedId } = await req.json();

  if (!feedId || typeof feedId !== "string") {
    return NextResponse.json({ error: "Invalid feedId" }, { status: 400 });
  }

  try {
    // feedId로 Feed 찾아서 삭제
    const deletedFeed = await prisma.feed.delete({
      where: {
        feedId: feedId,
      },
    });

    return NextResponse.json({ success: true, feedId: deletedFeed.feedId });

  } catch (error: any) {
    // 삭제 실패 (예: feedId가 없는 경우)
    console.error(`Failed to delete feed ${feedId}:`, error);
    // P2025 에러 코드는 레코드를 찾을 수 없을 때 발생
    if (error.code === 'P2025') {
        return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete feed", details: error.message }, { status: 500 });
  }
} 