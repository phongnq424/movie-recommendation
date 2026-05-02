import Image from "next/image";
import Link from "next/link";
import { CirclePlay, Star } from "lucide-react";
import { FloatingDock } from "@/components/FloatingDock";
import { MovieCard } from "@/components/MovieCard";
import { SiteHeader } from "@/components/SiteHeader";
import { movieService } from "@/lib/api/movie.service";
import type { MovieDetailResponse, Movie } from "@/lib/types/movie";

const fallbackBackdrop =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1800&auto=format&fit=crop";

const fallbackPoster =
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=700&auto=format&fit=crop";

export default async function HomePage() {
  let movies: Movie[] = [];
  let heroDetail: Movie | null = null;

  try {
    movies = await movieService.getPublishedMovies();

    const hero = pickHeroMovie(movies);

    if (hero) {
      heroDetail = await movieService.getMovieBySlug(hero.slug);
    }
  } catch {
    movies = [];
    heroDetail = null;
  }

  const heroMovie = heroDetail ?? pickHeroMovie(movies);
  const listMovies = movies.filter(
    (movie) => movie.publicId !== heroMovie?.publicId
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#08080a] text-white">
      <section className="relative min-h-screen">
        <HeroBackground movie={heroMovie} />

        <SiteHeader />
        <FloatingDock />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1480px] flex-col px-5 pb-14 pt-28 sm:px-8 lg:px-10">
          {heroMovie ? (
            <HeroSection movie={heroMovie} />
          ) : (
            <EmptyHero />
          )}

          <section className="relative z-10 mt-8 pb-24 lg:pl-24">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">TOP PHIM</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Danh sách phim đang được công khai trong hệ thống
                </p>
              </div>

              <Link
                href="/movies"
                className="hidden rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:bg-white/10 sm:block"
              >
                Xem tất cả
              </Link>
            </div>

            {listMovies.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-zinc-400">
                Chưa có nhiều phim PUBLISHED để hiển thị. Vào Postman/backend
                tạo thêm phim với status = PUBLISHED.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                {listMovies.slice(0, 10).map((movie) => (
                  <MovieCard key={movie.publicId} movie={movie} />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function pickHeroMovie(movies: Movie[]) {
  if (movies.length === 0) return null;

  const withBackdrop = movies.filter((movie) => Boolean(movie.backdropUrl));

  if (withBackdrop.length > 0) {
    return [...withBackdrop].sort(
      (a, b) =>
        (b.viewCount ?? 0) - (a.viewCount ?? 0) ||
        (b.averageRating ?? 0) - (a.averageRating ?? 0)
    )[0];
  }

  return movies[0];
}

function HeroBackground({
  movie,
}: {
  movie: Movie | MovieDetailResponse | null;
}) {
  const imageUrl = movie?.backdropUrl || movie?.posterUrl || fallbackBackdrop;

  return (
    <>
      <Image
        src={imageUrl}
        alt={movie?.title ?? "Movie backdrop"}
        fill
        priority
        className="object-cover opacity-80"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,#08080a_0%,rgba(8,8,10,0.94)_24%,rgba(8,8,10,0.54)_58%,rgba(8,8,10,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.24)_0%,rgba(8,8,10,0.36)_48%,#08080a_92%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(185,28,28,0.23),transparent_28rem)]" />
    </>
  );
}

function HeroSection({
  movie,
}: {
  movie: Movie | MovieDetailResponse;
}) {
  const genres = "genres" in movie ? movie.genres : [];
  const actors = "actors" in movie ? movie.actors : [];

  return (
    <section className="grid flex-1 items-center gap-10 pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:pt-20">
      <div className="max-w-3xl lg:pl-24">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-600/15 px-4 py-2 text-sm font-semibold text-red-100 shadow-lg shadow-red-950/30">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Phim đang nổi bật
        </div>

        <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
          {movie.title}
        </h1>

        {movie.originalTitle && (
          <p className="mt-3 text-xl font-semibold text-zinc-300">
            {movie.originalTitle}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-zinc-300">
          <span className="rounded-md bg-yellow-500 px-2 py-1 text-xs font-black text-black">
            IMDb {(movie.averageRating ?? 0).toFixed(1)}
          </span>

          {movie.releaseYear && <span>{movie.releaseYear}</span>}

          {movie.durationMinutes && (
            <>
              <span className="text-zinc-600">|</span>
              <span>{movie.durationMinutes} phút</span>
            </>
          )}

          {movie.quality && (
            <>
              <span className="text-zinc-600">|</span>
              <span>{movie.quality}</span>
            </>
          )}

          {movie.ageRating && (
            <>
              <span className="text-zinc-600">|</span>
              <span>{movie.ageRating}</span>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {genres.length > 0
            ? genres.slice(0, 4).map((genre) => (
              <span
                key={genre.id}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 backdrop-blur-md"
              >
                {genre.genreName}
              </span>
            ))
            : (
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 backdrop-blur-md">
                {movie.status}
              </span>
            )}

          <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 backdrop-blur-md">
            {movie.viewCount ?? 0} lượt xem
          </span>
        </div>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 line-clamp-3">
          {movie.description || "Chưa có mô tả cho phim này."}
        </p>

        {actors.length > 0 && (
          <p className="mt-4 line-clamp-1 text-sm font-semibold text-zinc-400">
            Diễn viên:{" "}
            <span className="text-zinc-200">
              {actors
                .slice(0, 4)
                .map((actor) => actor.actorFullName)
                .join(", ")}
            </span>
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={`/movies/${movie.slug}`}
            className="flex items-center gap-3 rounded-2xl bg-[#c91d1d] px-8 py-4 text-base font-bold shadow-xl shadow-red-950/40 transition hover:bg-[#e02727]"
          >
            <CirclePlay size={24} fill="currentColor" />
            Xem ngay
          </Link>

          <Link
            href={`/movies/${movie.slug}`}
            className="rounded-2xl border border-white/15 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition hover:bg-white/15"
          >
            Chi tiết phim
          </Link>
        </div>
      </div>

      <div className="hidden justify-end pr-6 lg:flex">
        <div className="relative h-[480px] w-[340px] overflow-hidden rounded-[36px] border border-white/10 bg-white/10 shadow-2xl shadow-black/50 backdrop-blur-md">
          <Image
            src={movie.posterUrl || movie.backdropUrl || fallbackPoster}
            alt={movie.title}
            fill
            className="object-cover"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6">
            <div className="mb-3 flex items-center gap-2 text-yellow-400">
              <Star size={18} fill="currentColor" />
              <span className="font-bold">
                {(movie.averageRating ?? 0).toFixed(1)}
              </span>
            </div>

            <h2 className="text-2xl font-black">{movie.title}</h2>

            {movie.originalTitle && (
              <p className="mt-1 text-sm text-zinc-300">
                {movie.originalTitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyHero() {
  return (
    <section className="grid flex-1 place-items-center pt-24 lg:pl-24">
      <div className="max-w-2xl rounded-[34px] border border-white/10 bg-[#111114]/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-600/15 px-4 py-2 text-sm font-semibold text-red-100">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          NovaFlix
        </div>

        <h1 className="text-5xl font-black tracking-tight">
          Chưa có phim để hiển thị
        </h1>

        <p className="mt-5 text-lg leading-8 text-zinc-300">
          API <span className="font-bold text-white">/api/movies/published</span>{" "}
          chưa trả dữ liệu. Tạo phim với status{" "}
          <span className="font-bold text-white">PUBLISHED</span> trước.
        </p>
      </div>
    </section>
  );
}