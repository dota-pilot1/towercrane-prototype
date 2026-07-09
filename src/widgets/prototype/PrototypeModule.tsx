import { useEffect, useMemo, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Pencil,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { getToken } from "../../shared/api/client";
import {
  createReview,
  deleteMyReview,
  getCategories,
  getMyReview,
  getReviews,
  updateMyReview,
  type CatalogCategory,
  type CatalogPrototype,
  type MyReview,
  type Review,
  type ReviewStats,
} from "../../features/prototype/api";
import PageHeader from "../../shared/ui/PageHeader";
import { Button } from "../../shared/ui/button";
import { toast } from "../../shared/ui/Toast";

const STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  building: "제작중",
  ready: "완료",
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function StarRating({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (next: number) => void;
  size?: number;
}) {
  const stars = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={size}
            className={
              n <= value
                ? "text-brand-primary fill-brand-primary"
                : "text-text-muted"
            }
          />
        </button>
      ))}
    </div>
  );
}

function UrlField({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("복사하지 못했습니다.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-text-muted w-12 shrink-0">
        {label}
      </span>
      <div className="ui-input flex items-center gap-1 h-8 pr-1">
        <span className="flex-1 truncate text-[12px] text-text-secondary">
          {url}
        </span>
        <button
          onClick={() => void copy()}
          className="ui-icon-button size-6 shrink-0"
          title="링크 복사"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
        <button
          onClick={() => void openUrl(url)}
          className="ui-icon-button size-6 shrink-0"
          title="열기"
        >
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}

function PrototypeModule() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CatalogPrototype | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CatalogCategory | null>(null);

  async function loadCategories() {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setError("로그인이 필요합니다.");
      return;
    }
    setLoading(true);
    try {
      setCategories(await getCategories(token));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "카탈로그를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((category) => ({
        category,
        prototypes: category.prototypes.filter((p) =>
          q
            ? p.title.toLowerCase().includes(q) ||
              p.summary.toLowerCase().includes(q)
            : true,
        ),
      }))
      .filter((group) => group.prototypes.length > 0);
  }, [categories, query]);

  function openDetail(category: CatalogCategory, prototype: CatalogPrototype) {
    setSelectedCategory(category);
    setSelected(prototype);
  }

  if (selected && selectedCategory) {
    return (
      <PrototypeDetail
        category={selectedCategory}
        prototype={selected}
        onBack={() => {
          setSelected(null);
          setSelectedCategory(null);
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <PageHeader>
        <span className="text-[14px] font-bold tracking-tight text-text-primary">
          프로토타입
        </span>
        <div className="flex-1" />
        <div data-actions className="relative w-64">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목/요약 검색"
            className="ui-input pl-8"
          />
        </div>
        <button
          onClick={() => void loadCategories()}
          className="ui-icon-button size-8"
          title="새로고침"
        >
          <RefreshCw size={14} />
        </button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto bg-surface-muted p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[13px] text-text-muted">
            불러오는 중…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-[13px] text-text-muted">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[13px] text-text-muted">
            표시할 프로토타입이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            {filtered.map(({ category, prototypes }) => (
              <section key={category.id}>
                <h2 className="text-[13px] font-bold text-text-secondary mb-3">
                  {category.title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {prototypes.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => openDetail(category, p)}
                      className="ui-panel text-left p-3 hover:border-brand-border transition flex flex-col gap-2"
                    >
                      <div className="h-32 rounded-md bg-surface-muted border border-surface-border-soft overflow-hidden flex items-center justify-center">
                        {p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] text-text-muted">
                            이미지 없음
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded border border-brand-border bg-brand-glass text-brand-primary">
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </div>
                      <span className="text-[13px] font-bold text-text-primary truncate">
                        {p.title}
                      </span>
                      <span className="text-[12px] text-text-secondary line-clamp-2">
                        {p.summary}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PrototypeDetail({
  category,
  prototype,
  onBack,
}: {
  category: CatalogCategory;
  prototype: CatalogPrototype;
  onBack: () => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [myReview, setMyReview] = useState<MyReview>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(8);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [list, mine] = await Promise.all([
        getReviews(token, prototype.id),
        getMyReview(token, prototype.id),
      ]);
      setReviews(list.items);
      setStats(list.stats);
      setMyReview(mine);
      if (mine) {
        setRating(mine.rating);
        setContent(mine.content);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "리뷰를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prototype.id]);

  async function submitReview() {
    const token = getToken();
    if (!token || !content.trim()) return;
    setSubmitting(true);
    try {
      if (myReview) {
        await updateMyReview(token, prototype.id, { rating, content });
        toast.success("리뷰를 수정했습니다.");
      } else {
        await createReview(token, prototype.id, { rating, content });
        toast.success("리뷰를 등록했습니다.");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeMyReview() {
    const token = getToken();
    if (!token) return;
    try {
      await deleteMyReview(token, prototype.id);
      setMyReview(null);
      setRating(8);
      setContent("");
      toast.success("리뷰를 삭제했습니다.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제하지 못했습니다.");
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <PageHeader>
        <button onClick={onBack} className="ui-icon-button size-8">
          <ArrowLeft size={14} />
        </button>
        <span className="text-[14px] font-bold tracking-tight text-text-primary">
          {prototype.title}
        </span>
        <span className="text-[12px] text-text-muted">{category.title}</span>
      </PageHeader>

      <div className="flex-1 overflow-y-auto bg-surface-muted p-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {prototype.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {prototype.images.map((img) => (
                <button
                  key={img}
                  onClick={() => void openUrl(img)}
                  className="h-24 rounded-md overflow-hidden border border-surface-border-soft"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="ui-panel p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded border border-brand-border bg-brand-glass text-brand-primary">
                {STATUS_LABEL[prototype.status] ?? prototype.status}
              </span>
              {prototype.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-1.5 py-0.5 rounded border border-surface-border-soft bg-surface-muted text-text-secondary"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <p className="text-[13px] text-text-primary leading-relaxed">
              {prototype.summary}
            </p>
            {prototype.checklist.length > 0 && (
              <ul className="flex flex-col gap-1">
                {prototype.checklist.map((item) => (
                  <li
                    key={item}
                    className="text-[12px] text-text-secondary flex items-center gap-1.5"
                  >
                    <span className="size-1 rounded-full bg-text-muted" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <UrlField label="저장소" url={prototype.repoUrl} />
              {prototype.demoUrl && <UrlField label="데모" url={prototype.demoUrl} />}
              {prototype.figmaUrl && <UrlField label="Figma" url={prototype.figmaUrl} />}
            </div>
          </div>

          <div className="ui-panel p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-text-primary">리뷰</span>
              {stats && stats.count > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(stats.avgRating)} size={14} />
                  <span className="text-[12px] text-text-secondary">
                    {stats.avgRating.toFixed(1)} ({stats.count})
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pb-4 border-b border-surface-border-soft">
              <StarRating value={rating} onChange={setRating} />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="리뷰를 남겨주세요"
                rows={3}
                className="ui-input h-auto py-2 resize-none"
              />
              <div className="flex items-center gap-2 self-end">
                {myReview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    tone="danger"
                    onClick={() => void removeMyReview()}
                  >
                    <Trash2 size={13} />
                    삭제
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={submitting || !content.trim()}
                  onClick={() => void submitReview()}
                >
                  <Pencil size={13} />
                  {myReview ? "수정" : "등록"}
                </Button>
              </div>
            </div>

            {loading ? (
              <span className="text-[12px] text-text-muted">불러오는 중…</span>
            ) : reviews.length === 0 ? (
              <span className="text-[12px] text-text-muted">
                아직 리뷰가 없습니다.
              </span>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map((r) => (
                  <div key={r.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-text-primary">
                        {r.userName}
                        {r.isMine && (
                          <span className="text-text-muted font-normal"> (나)</span>
                        )}
                      </span>
                      <StarRating value={r.rating} size={12} />
                      <span className="text-[11px] text-text-muted">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                    <p className="text-[13px] text-text-secondary leading-relaxed">
                      {r.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrototypeModule;
