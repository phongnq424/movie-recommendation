import { SiteHeader } from "@/components/SiteHeader";
import { InfiniteMovieList } from "@/components/InfiniteMovieList";
import { genreService } from "@/services/genre.service";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; actor?: string }>;
}) {
  const { genre: genreId, actor: actorId } = await searchParams;
  let filterName = "";

  try {
    if (genreId) {
      const activeGenres = await genreService.getActiveGenres();
      const genre = activeGenres.find((g) => g.publicId === genreId);
      if (genre) {
        filterName = genre.name;
      }
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách:", error);
  }

  return (
    <main className="min-h-screen bg-[#08080a] text-white pt-24 pb-14 px-5 sm:px-8 lg:px-12">
      <SiteHeader />
      <div className="mx-auto max-w-[1460px]">
        <div className="mb-8">
          <h1 className="text-3xl font-black md:text-4xl">
            {genreId ? (filterName ? `Phim thể loại: ${filterName}` : "Phim theo thể loại")
              : actorId ? "Phim của diễn viên"
                : "Tất cả phim"}
          </h1>
        </div>

        <InfiniteMovieList
          type="published"
          genreId={genreId}
          actorId={actorId}
          pageSize={10}
        />
      </div>
    </main>
  );
}
