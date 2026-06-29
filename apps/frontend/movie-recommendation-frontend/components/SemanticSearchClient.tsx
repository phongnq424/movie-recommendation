"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { movieService } from "@/services/movie.service";
import type { MovieVectorSearchResponse } from "@/types/movie";
import { SemanticMovieCard } from "@/components/SemanticMovieCard";

interface SemanticSearchClientProps {
    initialQuery?: string;
}

export function SemanticSearchClient({
    initialQuery = "",
}: SemanticSearchClientProps) {
    const router = useRouter();

    const [inputValue, setInputValue] = useState(initialQuery);
    const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
    const [movies, setMovies] = useState<MovieVectorSearchResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        setInputValue(initialQuery);
        setSubmittedQuery(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        let cancelled = false;

        async function searchSemanticMovies() {
            const query = submittedQuery.trim();

            if (!query) {
                setMovies([]);
                setErrorMessage("");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setErrorMessage("");

            try {
                const data = await movieService.searchMoviesByVectorText(query, 24);

                if (!cancelled) {
                    setMovies(data);
                }
            } catch (error) {
                console.error("Failed to search movies by vector text:", error);

                if (!cancelled) {
                    setMovies([]);
                    setErrorMessage(
                        "Không thể tìm kiếm bằng ngữ nghĩa. Vui lòng thử lại sau."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        void searchSemanticMovies();

        return () => {
            cancelled = true;
        };
    }, [submittedQuery]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const query = inputValue.trim();

        if (!query) {
            router.push("/search");
            setSubmittedQuery("");
            return;
        }

        router.push(`/search?q=${encodeURIComponent(query)}`);
        setSubmittedQuery(query);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
                    <Sparkles className="h-4 w-4" />
                    Semantic Vector Search
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-white md:text-4xl">
                        {submittedQuery
                            ? `Kết quả tìm kiếm: "${submittedQuery}"`
                            : "Tìm kiếm phim"}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                        Tìm phim theo ý nghĩa nội dung, không chỉ khớp tiêu đề. Ví dụ:
                        “social class”, “space adventure”, “family drama”.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex max-w-2xl gap-3">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />

                        <input
                            value={inputValue}
                            onChange={(event) => setInputValue(event.target.value)}
                            placeholder="Nhập mô tả nội dung phim..."
                            className="h-12 w-full rounded-full border border-white/10 bg-white/5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-red-500/60 focus:bg-white/10"
                        />
                    </div>

                    <button
                        type="submit"
                        className="h-12 rounded-full bg-red-600 px-6 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang tìm..." : "Tìm"}
                    </button>
                </form>
            </div>

            {!submittedQuery && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400">
                    Vui lòng nhập nội dung bạn muốn tìm kiếm.
                </div>
            )}

            {submittedQuery && isLoading && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {Array.from({ length: 12 }).map((_, index) => (
                        <div
                            key={index}
                            className="aspect-[2/3] animate-pulse rounded-2xl bg-white/10"
                        />
                    ))}
                </div>
            )}

            {submittedQuery && !isLoading && errorMessage && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
                    {errorMessage}
                </div>
            )}

            {submittedQuery && !isLoading && !errorMessage && movies.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400">
                    Không tìm thấy phim phù hợp.
                </div>
            )}

            {submittedQuery && !isLoading && !errorMessage && movies.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {movies.map((movie) => (
                        <SemanticMovieCard key={movie.publicId} movie={movie} />
                    ))}
                </div>
            )}
        </div>
    );
}