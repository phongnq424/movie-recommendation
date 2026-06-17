import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flag, Share2, Star } from "lucide-react";
import { movieService } from "@/services/movie.service";
import { YoutubeMoviePlayer } from "@/components/YoutubeMoviePlayer";


export default async function MovieWatchPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    let movie;
    try {
        movie = await movieService.getMovieDetailBySlug(slug);
    } catch {
        return notFound();
    }

    if (!movie) {
        return notFound();
    }

    return (
        <main className="min-h-screen bg-[#08080a] text-white selection:bg-red-500/30">
            {/* Header Player */}
            <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[#08080a]/90 px-5 backdrop-blur-md">
                <Link
                    href={`/movies/${movie.slug}`}
                    className="group flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
                >
                    <ArrowLeft
                        size={18}
                        className="transition-transform group-hover:-translate-x-1"
                    />
                    Trở lại
                </Link>

                <h1 className="mx-4 flex-1 line-clamp-1 text-center text-lg font-bold">
                    {movie.title}
                </h1>

                <div className="flex items-center gap-4">
                    <button
                        className="text-zinc-400 transition hover:text-white"
                        title="Chia sẻ"
                    >
                        <Share2 size={20} />
                    </button>
                    <button
                        className="text-zinc-400 transition hover:text-white"
                        title="Báo lỗi"
                    >
                        <Flag size={20} />
                    </button>
                </div>
            </header>

            {/* Video Player */}
            <section className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8">
                <div className="relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-xl">
                    {movie.movieUrl ? (
                        <YoutubeMoviePlayer
                            movieUrl={movie.movieUrl}
                            moviePublicId={movie.publicId}
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-zinc-900/50 text-zinc-500">
                            <p className="text-lg font-medium">
                                Nguồn phát phim đang được cập nhật.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Title & Short Details below video */}
            <section className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-12">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                        <h2 className="text-3xl font-black sm:text-4xl">{movie.title}</h2>

                        <div className="mt-6 max-w-4xl rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                            <h3 className="mb-3 text-lg font-bold text-white">
                                Nội dung phim
                            </h3>
                            <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
                                {movie.description || "Đang cập nhật nội dung..."}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
