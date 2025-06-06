"use client";
import { useState } from "react";
import { FiRss, FiLink, FiCheckCircle } from "react-icons/fi";

const YC_ORANGE = "#FF6600";

export default function Home() {
  const [url, setUrl] = useState("");
  const [feeds, setFeeds] = useState<{ original: string; rss: string; updatedAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!url.startsWith("http")) throw new Error("올바른 URL을 입력해 주세요.");
      // 실제 구현: 서버에 요청하여 RSS Feed 생성
      const res = await fetch("/api/generate-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "RSS Feed 생성에 실패했습니다.");
      }
      const data = await res.json();
      setFeeds([{ original: url, rss: data.rssUrl, updatedAt: data.updatedAt }, ...feeds]);
      setUrl("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeed = async (feedId: string) => {
    if (!feedId) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/update-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Feed 업데이트에 실패했습니다.");
      }

      console.log(`Feed ${feedId} 업데이트 성공!`);
    } catch (err: any) {
      setError(`업데이트 오류: ${err.message}`);
      console.error("Feed update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!feedId) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/delete-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Feed 삭제에 실패했습니다.");
      }

      setFeeds(feeds.filter(feed => feed.rss.split('/').pop()?.replace('.xml', '') !== feedId));

      console.log(`Feed ${feedId} 삭제 성공!`);

    } catch (err: any) {
      setError(`삭제 오류: ${err.message}`);
      console.error("Feed delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 px-4 py-10">
      <div className="w-full max-w-xl bg-white/90 dark:bg-neutral-900 rounded-2xl shadow-xl p-8 flex flex-col gap-8 border border-neutral-200 dark:border-neutral-800">
        <h1 className="text-3xl sm:text-4xl font-bold text-center flex items-center justify-center gap-2" style={{ color: YC_ORANGE }}>
          <FiRss className="inline-block" /> RSS Feed Generator
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-lg font-medium flex items-center gap-2" htmlFor="url">
            <FiLink /> 뉴스/블로그/뉴스레터 URL 입력
          </label>
          <div className="flex gap-2">
            <input
              id="url"
              type="url"
              required
              placeholder="https://example.com"
              className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-400 text-base bg-white dark:bg-neutral-800 transition"
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-[#FF6600] hover:bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !url}
            >
              {loading ? "생성 중..." : "RSS Feed 생성"}
            </button>
          </div>
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        </form>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <FiCheckCircle className="text-green-500" /> 생성된 RSS Feed
          </h2>
          {feeds.length === 0 ? (
            <div className="text-neutral-400 text-base">아직 생성된 RSS Feed가 없습니다.</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {feeds.map((feed, idx) => (
                <li key={feed.rss} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-4 py-3 border border-neutral-200 dark:border-neutral-700">
                  <span className="truncate text-neutral-700 dark:text-neutral-200 text-sm">
                    <FiLink className="inline mr-1 text-orange-500" />
                    {feed.original}
                  </span>
                  <a
                    href={feed.rss}
                    className="text-[#FF6600] font-mono underline break-all text-sm hover:text-orange-500 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {feed.rss}
                  </a>
                  <button
                    onClick={() => handleUpdateFeed(feed.rss.split('/').pop()?.replace('.xml', '') as string)}
                    className="ml-auto bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded transition shadow disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    업데이트
                  </button>
                  <button
                    onClick={() => handleDeleteFeed(feed.rss.split('/').pop()?.replace('.xml', '') as string)}
                    className="ml-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded transition shadow disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
