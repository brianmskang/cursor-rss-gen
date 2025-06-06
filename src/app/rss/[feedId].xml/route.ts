// globalThis에 타입 선언 (중복 방지) - DB 사용으로 제거
// declare global {
//   // eslint-disable-next-line no-var
//   var __rssFeeds__: Record<string, string> | undefined;
// }

import { NextRequest } from "next/server";
import prisma from "../../../../prisma/client"; // Prisma Client import

export async function GET(
  req: NextRequest,
  { params }: { params: { feedId: string } }
) {
  const { feedId: paramFeedId } = params; // URL에서 feedId를 가져옴

  // .xml 접미사 제거 (Optional, 라우트 정의에 따라 다름)
  const cleanFeedId = paramFeedId.replace(/\.xml$/, "");

  // DB에서 feedId로 RSS Feed 조회
  const feed = await prisma.feed.findUnique({
    where: {
      feedId: cleanFeedId,
    },
  });

  if (!feed) {
    // 해당 feedId의 Feed가 없으면 404 반환
    return new Response("Not Found", { status: 404 });
  }

  // DB에서 조회한 RSS XML 반환
  return new Response(feed.rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600", // 캐싱 설정 (조정 가능)
    },
  });

  // 임시 메모리 조회 로직 (제거됨)
  // const feeds = globalThis.__rssFeeds__ || {};
  // const xml = feeds[feedId.replace(/\.xml$/, "")];
  // if (!xml) {
  //   return new Response("Not Found", { status: 404 });
  // }
  // return new Response(xml, {
  //   status: 200,
  //   headers: {
  //     "Content-Type": "application/rss+xml; charset=utf-8",
  //     "Cache-Control": "no-store",
  //   },
  // });
} 