import { SiteHeader } from "@/components/SiteHeader";
import { MovieCard } from "@/components/MovieCard";
import { movieService } from "@/services/movie.service";
import { genreService } from "@/services/genre.service";
import { actorService } from "@/services/actor.service";
import type { Movie } from "@/types/movie";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; actor?: string }>;
}) {
  const { genre: genreId, actor: actorId } = await searchParams;
  let movies: Movie[] = [];
  let filterName = "";

  try {
    const allMovies = await movieService.getPublishedMovies();

    if (genreId) {
      const activeGenres = await genreService.getActiveGenres();
      const genre = activeGenres.find((g) => g.publicId === genreId);
      if (genre) {
        filterName = genre.name;
      }

      const movieGenres = await genreService.getMoviesByGenre(genreId);
      const genreMovieIds = new Set(movieGenres.map((mg) => mg.moviePublicId));

      movies = allMovies.filter((m) => genreMovieIds.has(m.publicId));
    } else if (actorId) {
      const movieActors = await actorService.getMoviesByActor(actorId);
      if (movieActors.length > 0) {
        filterName = movieActors[0].actorFullName;
      }
      const actorMovieIds = new Set(movieActors.map((ma: { moviePublicId: string }) => ma.moviePublicId));

      movies = allMovies.filter((m) => actorMovieIds.has(m.publicId));
    } else {
      movies = allMovies;
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách phim:", error);
    movies = [];
  }

  return (
    <main className="min-h-screen bg-[#08080a] text-white pt-24 pb-14 px-5 sm:px-8 lg:px-12">
      <SiteHeader />
      <div className="mx-auto max-w-[1460px]">
        <div className="mb-8">
          <h1 className="text-3xl font-black md:text-4xl">
            {genreId ? (filterName ? `Phim thể loại: ${filterName}` : "Phim theo thể loại") 
             : actorId ? (filterName ? `Phim của diễn viên: ${filterName}` : "Phim của diễn viên")
             : "Tất cả phim"}
          </h1>
          <p className="mt-2 text-zinc-400">
            Hiển thị {movies.length} kết quả
          </p>
        </div>

        {movies.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-400">
            Không tìm thấy phim nào.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard key={movie.publicId} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
