import Parser from "rss-parser";
import * as cheerio from 'cheerio'; // cheerio import
// 내장 fetch 사용

// HTML에서 콘텐츠를 추출하여 RSS 아이템 형식으로 변환하는 함수 (기본 구현)
async function parseHtmlToRssItems(html: string, baseUrl: string) {
  const $ = cheerio.load(html);
  const items: any[] = [];

  // 기본적인 콘텐츠 블록 탐색 (조정 필요)
  $('article, main, .content').each((i, element) => {
    if (items.length >= 5) return false; // 최대 5개 아이템

    const $el = $(element);
    const title = $el.find('h1, h2, h3').first().text().trim() || $('title').text().trim() || 'No Title';
    const link = $el.find('a[href]').first().attr('href');
    const description = $el.find('p').first().text().trim().substring(0, 200) + '...'; // 첫 단락 200자
    // 발행일은 HTML에서 찾기 어려우므로 현재 시각 사용
    const pubDate = new Date().toUTCString();

    if (title && link) {
       // 상대 경로 링크를 절대 경로로 변환
      const absoluteLink = new URL(link, baseUrl).toString();
      items.push({
        title,
        link: absoluteLink,
        description,
        pubDate,
      });
    }
  });

  // 찾은 아이템이 없으면 페이지 타이틀과 설명으로 하나의 아이템 생성
  if (items.length === 0) {
     const title = $('title').text().trim() || 'RSS Feed';
     const description = $('meta[name="description"]').attr('content') || $('p').first().text().trim().substring(0, 200) + '...';
      items.push({
        title,
        link: baseUrl,
        description,
        pubDate: new Date().toUTCString(),
      });
  }

  return items;
}

// XML 특수 문자 이스케이프 함수
function escapeXml(unsafe: string | null | undefined) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c; // Should not happen
    });
}

// 원본 URL을 파싱하여 RSS XML 문자열을 생성하는 메인 함수
export async function parseAndGenerateRssXml(url: string): Promise<string> {
  let rssXml = "";
  let parsed = null;

  // 1. RSS 파서로 먼저 시도
  try {
    const parser = new Parser();
    parsed = await parser.parseURL(url);
    // RSS 파싱 성공 시 XML 생성
    const items = (parsed.items || []).slice(0, 5)
      .map(item => `
      <item>
        <title>${escapeXml(item.title || "No title")}</title>
        <link>${escapeXml(item.link || "")}</link>
        <description>${escapeXml(item.contentSnippet || item.content || "")}</description>
        <pubDate>${item.pubDate || ""}</pubDate>
      </item>`).join("");
    rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>${escapeXml(parsed.title || "RSS Feed")}</title>
        <link>${escapeXml(parsed.link || url)}</link>
        <description>${escapeXml(parsed.description || "Generated RSS Feed")}</description>
        ${items}
      </channel>
    </rss>`;
  } catch (rssError) {
    console.warn(`RSS parsing failed for ${url}:`, rssError);
    
    // 2. RSS 파싱 실패 시 HTML 파싱 시도
    try {
      const response = await fetch(url);
      if (!response.ok) {
         throw new Error(`Failed to fetch HTML: ${response.statusText}`);
      }
      const html = await response.text();
      const items = await parseHtmlToRssItems(html, url);

       // HTML 파싱 성공 시 RSS XML 생성
       const pageTitle = cheerio.load(html)('title').text().trim() || 'RSS Feed from HTML';
       const pageDescription = cheerio.load(html)('meta[name="description"]').attr('content') || 'Generated from HTML content';

      const rssItemsXml = items.map(item => `
      <item>
        <title>${escapeXml(item.title)}</title>
        <link>${escapeXml(item.link)}</link>
        <description>${escapeXml(item.description)}</description>
        <pubDate>${item.pubDate}</pubDate>
      </item>`).join("");

      rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0">
        <channel>
          <title>${escapeXml(pageTitle)}</title>
          <link>${escapeXml(url)}</link>
          <description>${escapeXml(pageDescription)}</description>
          ${rssItemsXml}
        </channel>
      </rss>`;

    } catch (htmlError) {
      console.error(`HTML parsing failed for ${url}:`, htmlError);
      // HTML 파싱도 실패 시 기본 더미 XML 반환
       rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0">
        <channel>
          <title>Could not generate RSS for ${escapeXml(url)}</title>
          <link>${escapeXml(url)}</link>
          <description>Failed to generate RSS Feed from the provided URL.</description>
          <item>
            <title>Error</title>
            <link>${escapeXml(url)}</link>
            <description>Could not parse content from the page.</description>
            <pubDate>${new Date().toUTCString()}</pubDate>
          </item>
        </channel>
      </rss>`;
    }
  }

  return rssXml;
} 