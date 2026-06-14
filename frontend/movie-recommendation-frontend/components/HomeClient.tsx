"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Star,
  User,
  Film,
  Sparkles,
  TrendingUp,
  Flame,
  RefreshCw
} from "lucide-react";
import { recommendationService } from "@/services/recommendation.service";
import { actorService } from "@/services/actor.service";
import { MovieCard } from "@/components/MovieCard";
import { MovieTrailer } from "@/components/MovieTrailer";
import { SiteHeader } from "@/components/SiteHeader";
import { FloatingDock } from "@/components/FloatingDock";
import type { Movie } from "@/types/movie";
import type { RecommendationResponse } from "@/types/recommendation";
import type { Actor } from "@/types/actor";

const fallbackBackdrop =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1800&auto=format&fit=crop";

const fallbackPoster =
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=700&auto=format&fit=crop";

export default function HomeClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // 1. Quản lý trạng thái xác thực
  useEffect(() => {
    const checkAuth = () => {
      const userInfo = localStorage.getItem("user_info");
      const token = localStorage.getItem("access_token") || document.cookie.includes("access_token");
      setIsAuthenticated(Boolean(userInfo || token));
    };

    checkAuth();
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, []);

  // 2. Tải dữ liệu Đề xuất (Public hoặc Cá nhân hóa)
  const {
    data: recommendations = [],
    isLoading: isRecsLoading,
    error: recsError,
    refetch: refetchRecs,
    isRefetching: isRecsRefetching
  } = useQuery<RecommendationResponse[]>({
    queryKey: ["recommendations", isAuthenticated],
    queryFn: () => {
      if (isAuthenticated) {
        return recommendationService.getMyRecommendations(20);
      }
      return recommendationService.getPublicRecommendations(20);
    },
    staleTime: 5 * 60 * 1000, // 5 phút cache
  });

  // 3. Tải danh sách Diễn viên nổi bật
  const {
    data: featuredActors = [],
    isLoading: isActorsLoading,
    error: actorsError
  } = useQuery<Actor[]>({
    queryKey: ["featuredActors"],
    queryFn: () => actorService.getFeaturedActors(),
    staleTime: 10 * 60 * 1000, // 10 phút cache
  });

  // 4. Phân bổ dữ liệu
  // Sắp xếp theo finalScore giảm dần để lấy Top 3 cho Hero Banner
  const sortedByFinalScore = [...recommendations].sort((a, b) => b.finalScore - a.finalScore);
  const heroMovies = sortedByFinalScore.slice(0, 3);

  // Hàng 1 (Dành riêng cho bạn / Phim đề xuất còn lại): Sắp xếp theo finalScore giảm dần
  const forYouMovies = sortedByFinalScore.slice(3);

  // Hàng 2 (Đang Thịnh Hành): Sắp xếp theo popularityScore hoặc viewCount
  const trendingMovies = [...recommendations].sort((a, b) => {
    const scoreA = a.scoreBreakdown?.popularityScore ?? a.viewCount ?? 0;
    const scoreB = b.scoreBreakdown?.popularityScore ?? b.viewCount ?? 0;
    return scoreB - scoreA;
  });

  // Hàng 3 (Làn Sóng Mới): Sắp xếp theo freshnessScore hoặc releaseYear gần đây nhất
  const newWaveMovies = [...recommendations].sort((a, b) => {
    const scoreA = a.scoreBreakdown?.freshnessScore ?? a.releaseYear ?? 0;
    const scoreB = b.scoreBreakdown?.freshnessScore ?? b.releaseYear ?? 0;
    return scoreB - scoreA;
  });

  // Tự động chuyển slide Hero Banner
  useEffect(() => {
    if (heroMovies.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroMovies.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [heroMovies.length]);

  // Hàm refresh thủ công đề xuất cho user đăng nhập
  const handleRefreshRecommendations = async () => {
    if (!isAuthenticated) return;
    try {
      await recommendationService.refreshMyRecommendations(20);
      refetchRecs();
    } catch (err) {
      console.error("Lỗi khi cập nhật gợi ý mới:", err);
    }
  };

  const mapRecToMovie = (rec: RecommendationResponse): Movie => {
    return {
      publicId: rec.moviePublicId,
      title: rec.title,
      originalTitle: rec.originalTitle,
      slug: rec.slug,
      description: rec.description,
      releaseYear: rec.releaseYear,
      durationMinutes: rec.durationMinutes,
      posterUrl: rec.posterUrl,
      backdropUrl: rec.backdropUrl,
      trailerUrl: rec.trailerUrl,
      movieUrl: rec.movieUrl,
      quality: rec.quality,
      ageRating: rec.ageRating,
      averageRating: rec.averageRating,
      ratingCount: rec.ratingCount,
      viewCount: rec.viewCount,
      status: "PUBLISHED"
    };
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#08080a] text-white">
      <SiteHeader />
      <FloatingDock />

      {/* 1. HERO BANNER SECTION (SLIDER TOP 3) */}
      <section className="relative min-h-[70vh] sm:min-h-[75vh] lg:min-h-[85vh]">
        {isRecsLoading ? (
          <HeroSkeleton />
        ) : recsError ? (
          <HeroErrorView error={recsError} onRetry={refetchRecs} />
        ) : heroMovies.length === 0 ? (
          <EmptyHeroView />
        ) : (
          <div className="relative h-[70vh] sm:h-[75vh] lg:h-[85vh] w-full overflow-hidden">
            {heroMovies.map((movie, index) => {
              const isActive = index === currentSlide;
              const backdropUrl = movie.backdropUrl || movie.posterUrl || fallbackBackdrop;
              const posterUrl = movie.posterUrl || movie.backdropUrl || fallbackPoster;

              // Quy đổi finalScore sang phần trăm (VD: 0.98 -> 98% hoặc 98.0 -> 98%)
              const compatibilityScore = Math.round(
                movie.finalScore > 1 ? movie.finalScore : movie.finalScore * 100
              );
              const compatibilityPercentage = Math.min(100, Math.max(0, compatibilityScore));

              return (
                <div
                  key={movie.moviePublicId}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                >
                  {/* Backdrop Background */}
                  <div className="absolute inset-0">
                    <Image
                      src={backdropUrl}
                      alt={movie.title}
                      fill
                      priority={index === 0}
                      className="object-cover opacity-60 transition-transform duration-[7000ms] ease-out scale-105"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,#08080a_0%,rgba(8,8,10,0.96)_20%,rgba(8,8,10,0.4)_50%,rgba(8,8,10,0.90)_100%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.1)_0%,rgba(8,8,10,0.3)_40%,#08080a_92%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(220,38,38,0.18),transparent_32rem)]" />
                  </div>

                  {/* Content Layout */}
                  <div className="relative z-10 mx-auto flex h-full max-w-[1460px] flex-col justify-center px-5 pb-10 pt-20 sm:px-8 lg:px-12">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">

                      {/* Left: Info panel (Glassmorphic) */}
                      <div className="max-w-2xl rounded-3xl border border-white/10 bg-black/40 p-6 md:p-8 backdrop-blur-md animate-fadeIn shadow-2xl">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400">
                            <Sparkles size={12} className="animate-pulse" />
                            {compatibilityPercentage}% Phù hợp
                          </span>
                        </div>

                        <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl line-clamp-2">
                          {movie.title}
                        </h1>

                        {movie.originalTitle && (
                          <p className="mt-2 text-lg font-semibold text-zinc-300">
                            {movie.originalTitle}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-300">
                          <span className="flex items-center gap-1 rounded-md bg-yellow-500 px-2 py-0.5 text-[11px] font-black text-black">
                            <Star size={11} fill="currentColor" />
                            IMDb {(movie.averageRating ?? 0).toFixed(1)}
                          </span>

                          <span>{movie.releaseYear}</span>
                          <span className="text-zinc-600">|</span>
                          <span>{movie.durationMinutes} phút</span>

                          {movie.quality && (
                            <>
                              <span className="text-zinc-600">|</span>
                              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase font-extrabold tracking-wide">
                                {movie.quality}
                              </span>
                            </>
                          )}

                          {movie.ageRating && (
                            <>
                              <span className="text-zinc-600">|</span>
                              <span className="rounded border border-red-500/30 bg-red-600/10 px-1.5 py-0.5 text-[10px] font-extrabold text-red-400">
                                {movie.ageRating}
                              </span>
                            </>
                          )}
                        </div>

                        <p className="mt-5 text-sm md:text-base leading-relaxed text-zinc-300 line-clamp-3">
                          {movie.description || "Chưa có mô tả cho bộ phim này."}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-4">
                          <Link
                            href={`/movies/${movie.slug}/watch`}
                            className="flex items-center gap-3 rounded-2xl bg-[#c91d1d] px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-950/40 transition-all hover:bg-[#e02727] active:scale-95 cursor-pointer"
                          >
                            <CirclePlay size={20} fill="currentColor" />
                            Xem ngay
                          </Link>

                          {movie.trailerUrl && (
                            <MovieTrailer
                              trailerUrl={movie.trailerUrl}
                              movieTitle={movie.title}
                            />
                          )}

                          <Link
                            href={`/movies/${movie.slug}`}
                            className="rounded-2xl border border-white/15 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                          >
                            Chi tiết phim
                          </Link>
                        </div>
                      </div>

                      {/* Right: Floating Movie Poster (desktop only) */}
                      <div className="hidden justify-center pr-6 lg:flex">
                        <Link
                          href={`/movies/${movie.slug}`}
                          className="group relative h-[420px] w-[300px] overflow-hidden rounded-[32px] border border-white/10 bg-white/10 shadow-2xl transition-all duration-500 hover:scale-105 hover:border-white/20"
                        >
                          <Image
                            src={posterUrl}
                            alt={movie.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="absolute inset-x-0 bottom-0 p-5 transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 bg-gradient-to-t from-black via-black/80 to-transparent">
                            <h3 className="text-lg font-bold text-white">{movie.title}</h3>
                            <p className="mt-1 text-xs text-zinc-300">{movie.originalTitle}</p>
                          </div>
                        </Link>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}

            {/* Slider Dots Indicator */}
            {heroMovies.length > 1 && (
              <div className="absolute bottom-8 right-5 z-20 flex gap-2 sm:right-8 lg:right-12">
                {heroMovies.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${i === currentSlide ? "w-8 bg-red-600" : "w-2.5 bg-zinc-500/60 hover:bg-zinc-400"
                      }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. CATEGORIES ROW SECTION (CAROUSEL ROWS) */}
      <section className="relative z-10 px-5 pb-32 sm:px-8 lg:px-12 -mt-10 max-w-[1460px] mx-auto space-y-16">

        {/* Hàng 1: Dành riêng cho bạn */}
        {isRecsLoading ? (
          <RowSkeleton />
        ) : recommendations.length > 0 && (
          <MovieRow
            title={isAuthenticated ? "Dành riêng cho bạn" : "Gợi ý hôm nay"}
            icon={<Sparkles className="text-emerald-400" size={20} />}
            subtitle={isAuthenticated ? "Những bộ phim được đề xuất dựa trên sở thích xem và đánh giá của bạn" : "Đề xuất những bộ phim hấp dẫn nhất hệ thống dành cho mọi người"}
            movies={forYouMovies.map(mapRecToMovie)}
          />
        )}

        {/* Hàng diễn viên nổi bật */}
        <FeaturedActorsRow
          actors={featuredActors}
          isLoading={isActorsLoading}
          error={actorsError}
        />

        {/* Hàng 2: Đang thịnh hành */}
        {!isRecsLoading && recommendations.length > 0 && (
          <MovieRow
            title="Đang Thịnh Hành"
            icon={<TrendingUp className="text-red-500" size={20} />}
            subtitle="Top phim được nhiều người xem nhất và có mức độ phổ biến cao trong hệ thống"
            movies={trendingMovies.map(mapRecToMovie)}
          />
        )}

        {/* Hàng 3: Làn Sóng Mới */}
        {!isRecsLoading && recommendations.length > 0 && (
          <MovieRow
            title="Làn Sóng Mới"
            icon={<Flame className="text-orange-500" size={20} />}
            subtitle="Những tác phẩm mới ra mắt gần đây hoặc mới được thêm vào, khơi nguồn khám phá"
            movies={newWaveMovies.map(mapRecToMovie)}
          />
        )}

      </section>
    </main>
  );
}

/* =========================================================================
   COMPONENTS HỖ TRỢ
   ========================================================================= */

// Component Hàng phim (MovieRow) cuộn ngang có nút scroll trái phải
interface MovieRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  movies: Movie[];
  extraHeader?: React.ReactNode;
}

function MovieRow({ title, subtitle, icon, movies, extraHeader }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftBtn(scrollLeft > 10);
      setShowRightBtn(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      // Kiểm tra lần đầu tiên
      checkScroll();

      // Resize check
      const handleResize = () => checkScroll();
      window.addEventListener("resize", handleResize);

      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [movies]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const amount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - amount : scrollLeft + amount,
        behavior: "smooth",
      });
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className="relative group/row">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight uppercase">
            {icon}
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {extraHeader}
          <Link
            href="/movies"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Xem tất cả
          </Link>
        </div>
      </div>

      {/* Control buttons */}
      {showLeftBtn && (
        <button
          onClick={() => handleScroll("left")}
          className="absolute left-0 top-[40%] z-20 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white backdrop-blur-md shadow-2xl opacity-0 transition group-hover/row:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {showRightBtn && (
        <button
          onClick={() => handleScroll("right")}
          className="absolute right-0 top-[40%] z-20 translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white backdrop-blur-md shadow-2xl opacity-0 transition group-hover/row:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-4 no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {movies.map((movie) => (
          <div key={movie.publicId} className="w-[180px] shrink-0 sm:w-[220px]">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Component Hàng diễn viên nổi bật (FeaturedActorsRow)
interface FeaturedActorsRowProps {
  actors: Actor[];
  isLoading: boolean;
  error: unknown;
}

function FeaturedActorsRow({ actors, isLoading, error }: FeaturedActorsRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 10);
      setShowRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      checkScroll();
      const handleResize = () => checkScroll();
      window.addEventListener("resize", handleResize);

      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [actors]);

  const handleScroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const amount = clientWidth * 0.7;
      scrollRef.current.scrollTo({
        left: dir === "left" ? scrollLeft - amount : scrollLeft + amount,
        behavior: "smooth"
      });
    }
  };

  if (error) return null;
  if (!isLoading && actors.length === 0) return null;

  return (
    <div className="relative group/actors">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight uppercase">
          <User className="text-blue-400" size={20} />
          Diễn viên nổi bật
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Khám phá tác phẩm của những diễn viên được yêu thích nhất
        </p>
      </div>

      {/* Control buttons */}
      {showLeft && (
        <button
          onClick={() => handleScroll("left")}
          className="absolute left-0 top-[50%] z-20 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white backdrop-blur-md shadow-lg opacity-0 transition group-hover/actors:opacity-100 hover:scale-105 cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {showRight && (
        <button
          onClick={() => handleScroll("right")}
          className="absolute right-0 top-[50%] z-20 translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white backdrop-blur-md shadow-lg opacity-0 transition group-hover/actors:opacity-100 hover:scale-105 cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {isLoading ? (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="flex w-24 shrink-0 flex-col items-center gap-3">
              <div className="h-24 w-24 animate-pulse rounded-full bg-zinc-800" />
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {actors.map((actor) => (
            <Link
              href={`/movies?actor=${actor.publicId}`}
              key={actor.publicId}
              className="group flex w-24 shrink-0 flex-col items-center text-center sm:w-28"
            >
              <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-white/10 bg-zinc-850 transition-all duration-300 group-hover:scale-105 group-hover:border-red-500 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] sm:h-24 sm:w-24">
                {actor.avatarUrl ? (
                  <Image
                    src={actor.avatarUrl}
                    alt={actor.fullName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-500">
                    <Film size={24} />
                  </div>
                )}
              </div>
              <h3 className="line-clamp-2 text-xs font-semibold text-zinc-300 group-hover:text-red-400 transition-colors">
                {actor.fullName}
              </h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Loading Skeleton cho Hero Banner
function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] sm:h-[75vh] lg:h-[85vh] w-full bg-[#08080a] flex items-center">
      <div className="mx-auto w-full max-w-[1460px] px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-md">
          <div className="h-6 w-32 animate-pulse rounded-full bg-zinc-850" />
          <div className="mt-6 h-12 w-3/4 animate-pulse rounded-xl bg-zinc-850" />
          <div className="mt-3 h-6 w-1/2 animate-pulse rounded-lg bg-zinc-850" />
          <div className="mt-5 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-zinc-850" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-850" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-850" />
          </div>
          <div className="mt-8 flex gap-4">
            <div className="h-12 w-36 animate-pulse rounded-2xl bg-zinc-850" />
            <div className="h-12 w-28 animate-pulse rounded-2xl bg-zinc-850" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton cho Hàng phim
function RowSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-850" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-850" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded bg-zinc-850" />
      </div>
      <div className="flex gap-5 overflow-x-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[180px] sm:w-[220px] shrink-0 space-y-3">
            <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-zinc-850" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-850" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-850" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Giao diện khi chưa có phim nào
function EmptyHeroView() {
  return (
    <div className="grid h-[70vh] sm:h-[75vh] lg:h-[85vh] place-items-center bg-[#08080a] pt-24">
      <div className="max-w-2xl rounded-[34px] border border-white/10 bg-[#111114]/80 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-600/15 px-4 py-2 text-sm font-semibold text-red-100">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          NovaFlix
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">
          Chưa có phim đề xuất
        </h1>
        <p className="mt-4 text-base text-zinc-400">
          Hệ thống khuyến nghị phim chưa có dữ liệu để hiển thị. Hãy tạo thêm phim mới ở trang quản trị hoặc kiểm tra lại kết nối cơ sở dữ liệu.
        </p>
      </div>
    </div>
  );
}

// Giao diện khi có lỗi tải dữ liệu
interface HeroErrorViewProps {
  error: unknown;
  onRetry: () => void;
}

function HeroErrorView({ error, onRetry }: HeroErrorViewProps) {
  const message = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định";

  return (
    <div className="grid h-[70vh] sm:h-[75vh] lg:h-[85vh] place-items-center bg-[#08080a] pt-24">
      <div className="max-w-md rounded-3xl border border-red-500/20 bg-red-950/20 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-900/30 text-red-400">
          <Film size={28} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-white">Không thể tải dữ liệu trang chủ</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {message}. Vui lòng kiểm tra dịch vụ Backend (API Server) hoặc thử lại.
        </p>
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition active:scale-95 cursor-pointer"
        >
          <RefreshCw size={14} />
          Thử tải lại
        </button>
      </div>
    </div>
  );
}
