import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/client"; // Prisma Client import
import { parseAndGenerateRssXml } from "../../../utils/parseAndGenerateRss"; // 파싱 유틸리티 함수 import

export async function POST(req: NextRequest) {
  const { feedId } = await req.json();

  if (!feedId || typeof feedId !== "string") {
    return NextResponse.json({ error: "Invalid feedId" }, { status: 400 });
  }

  try {
    // 1. DB에서 해당 feedId의 Feed 정보 조회
    const feedToUpdate = await prisma.feed.findUnique({
      where: {
        feedId: feedId,
      },
    });

    if (!feedToUpdate) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    // 2. 원본 URL을 다시 파싱하여 최신 RSS XML 생성
    const updatedRssXml = await parseAndGenerateRssXml(feedToUpdate.originalUrl);

    // 3. DB에 저장된 Feed 레코드 업데이트
    const updatedFeed = await prisma.feed.update({
      where: {
        id: feedToUpdate.id,
      },
      data: {
        rssXml: updatedRssXml,
        updatedAt: new Date(), // 업데이트 시각 갱신
      },
    });

    return NextResponse.json({ success: true, feedId: updatedFeed.feedId, originalUrl: updatedFeed.originalUrl });

  } catch (error: any) {
    console.error(`Failed to update feed ${feedId}:`, error);
    return NextResponse.json({ error: "Failed to update feed", details: error.message }, { status: 500 });
  }
}
