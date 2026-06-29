"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { movieService } from "@/services/movie.service";
import type { MovieVectorSearchResponse } from "@/types/movie";
import { SemanticMovieCard } from "@/components/SemanticMovieCard";

interface SimilarVectorMoviesSectionProps {
    moviePublicId: string;
    currentMovieTitle?: string;
    limit?: number;
}

export function SimilarVectorMoviesSection({
    moviePublicId,
    currentMovieTitle,
    limit = 12,
}: SimilarVectorMoviesSectionProps) {
    const [movies, setMovies] = useState<MovieVectorSearchResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadSimilarMovies() {
            if (!moviePublicId) {
                return;
            }

            setIsLoading(true);
            setErrorMessage("");

            try {
                const data = await movieService.getSimilarVectorMovies(
                    moviePublicId,
                    limit
                );

                if (!cancelled) {
                    setMovies(data);
                }
            } catch (error) {
                console.error("Failed to load similar vector movies:", error);

                if (!cancelled) {
                    setErrorMessage("Không thể tải danh sách phim tương tự.");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        void loadSimilarMovies();

        return () => {
            cancelled = true;
        };
    }, [moviePublicId, limit]);

    if (!isLoading && !errorMessage && movies.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-2">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
                    <Sparkles className="h-4 w-4" />
                    Gợi ý cho bạn
                </div>

                <h2 className="text-2xl font-bold text-white md:text-3xl">
                    Phim tương tự
                </h2>

                <p className="max-w-2xl text-sm text-zinc-400">
                    {currentMovieTitle
                        ? `Những phim có nội dung gần với "${currentMovieTitle}" dựa trên embedding ngữ nghĩa.`
                        : "Những phim có nội dung gần nhau dựa trên embedding ngữ nghĩa."}
                </p>
            </div>

            {isLoading && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="aspect-[2/3] animate-pulse rounded-2xl bg-white/10"
                        />
                    ))}
                </div>
            )}

            {!isLoading && errorMessage && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
                    {errorMessage}
                </div>
            )}

            {!isLoading && !errorMessage && movies.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {movies.map((movie) => (
                        <SemanticMovieCard key={movie.publicId} movie={movie} />
                    ))}
                </div>
            )}
        </section>
    );
}