'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { movieService } from '@/services/movie.service';
import { genreService } from '@/services/genre.service';
import { actorService } from '@/services/actor.service';
import type { Movie, PaginationResponse } from '@/types/movie';
import { MovieCard } from './MovieCard';

interface InfiniteMovieListProps {
    type: 'all' | 'published' | 'search';
    genreId?: string;
    actorId?: string;
    searchKeyword?: string;
    pageSize?: number;
}

export function InfiniteMovieList({
    type,
    genreId,
    actorId,
    searchKeyword,
    pageSize = 10,
}: InfiniteMovieListProps) {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const moviesRef = useRef<Movie[]>([]);
    const nextPageRef = useRef(0);
    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const generationRef = useRef(0);
    const loadedPagesRef = useRef<Set<number>>(new Set());
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelInViewRef = useRef(false);

    const fetchMoviesPage = useCallback(
        async (page: number): Promise<PaginationResponse<Movie>> => {
            if (type === 'search') {
                if (!searchKeyword || !searchKeyword.trim()) {
                    return {
                        content: [],
                        page,
                        size: pageSize,
                        totalElements: 0,
                        totalPages: 0,
                        first: page === 0,
                        last: true,
                        empty: true,
                    };
                }

                return movieService.searchPublishedMoviesPaginated(
                    searchKeyword.trim(),
                    page,
                    pageSize
                );
            }

            if (type === 'published') {
                return movieService.getPublishedMoviesPaginated(page, pageSize);
            }

            return movieService.getAllMoviesPaginated(page, pageSize);
        },
        [type, searchKeyword, pageSize]
    );

    const applyClientFilters = useCallback(
        async (items: Movie[]): Promise<Movie[]> => {
            let result = items;

            if (genreId) {
                const movieGenres = await genreService.getMoviesByGenre(genreId);
                const allowedMovieIds = new Set(
                    movieGenres.map((item) => item.moviePublicId)
                );

                result = result.filter((movie) => allowedMovieIds.has(movie.publicId));
            }

            if (actorId) {
                const movieActors = await actorService.getMoviesByActor(actorId);
                const allowedMovieIds = new Set(
                    movieActors.map((item: { moviePublicId: string }) => item.moviePublicId)
                );

                result = result.filter((movie) => allowedMovieIds.has(movie.publicId));
            }

            return result;
        },
        [genreId, actorId]
    );

    const appendUniqueMovies = useCallback((items: Movie[]) => {
        if (items.length === 0) {
            return 0;
        }

        const existingIds = new Set(moviesRef.current.map((movie) => movie.publicId));
        const uniqueItems = items.filter((movie) => !existingIds.has(movie.publicId));

        if (uniqueItems.length === 0) {
            return 0;
        }

        const nextMovies = [...moviesRef.current, ...uniqueItems];

        moviesRef.current = nextMovies;
        setMovies(nextMovies);

        return uniqueItems.length;
    }, []);

    const loadNextPage = useCallback(async () => {
        if (isLoadingRef.current || !hasMoreRef.current) {
            return;
        }

        const currentGeneration = generationRef.current;
        const attemptedPages: number[] = [];

        isLoadingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            let shouldContinue = true;
            let safetyCount = 0;

            while (shouldContinue && hasMoreRef.current && safetyCount < 10) {
                const currentPage = nextPageRef.current;

                if (loadedPagesRef.current.has(currentPage)) {
                    nextPageRef.current = currentPage + 1;
                    safetyCount++;
                    continue;
                }

                loadedPagesRef.current.add(currentPage);
                attemptedPages.push(currentPage);

                const response = await fetchMoviesPage(currentPage);

                if (currentGeneration !== generationRef.current) {
                    return;
                }

                const rawMovies = response.content || [];
                const filteredMovies = await applyClientFilters(rawMovies);

                if (currentGeneration !== generationRef.current) {
                    return;
                }

                const addedCount = appendUniqueMovies(filteredMovies);

                const totalPages = response.totalPages ?? 0;
                const isLastPage =
                    response.last === true ||
                    response.isLast === true ||
                    totalPages <= 0 ||
                    currentPage + 1 >= totalPages ||
                    rawMovies.length === 0;

                nextPageRef.current = currentPage + 1;
                hasMoreRef.current = !isLastPage;
                setHasMore(!isLastPage);

                safetyCount++;

                const hasClientFilter = Boolean(genreId || actorId);

                if (addedCount > 0) {
                    shouldContinue = false;
                    continue;
                }

                if (isLastPage) {
                    shouldContinue = false;
                    continue;
                }

                if (!hasClientFilter) {
                    shouldContinue = false;
                    continue;
                }
            }
        } catch (err) {
            attemptedPages.forEach((page) => {
                loadedPagesRef.current.delete(page);
            });

            hasMoreRef.current = false;
            setHasMore(false);

            const errorMessage =
                err instanceof Error ? err.message : 'Failed to load movies';

            setError(errorMessage);
            console.error('Error loading movies:', err);
        } finally {
            if (currentGeneration === generationRef.current) {
                isLoadingRef.current = false;
                setIsLoading(false);

                if (sentinelInViewRef.current && hasMoreRef.current) {
                    window.setTimeout(() => {
                        if (!isLoadingRef.current && hasMoreRef.current) {
                            void loadNextPage();
                        }
                    }, 0);
                }
            }
        }
    }, [
        fetchMoviesPage,
        applyClientFilters,
        appendUniqueMovies,
        genreId,
        actorId,
    ]);

    const retryLoad = useCallback(() => {
        setError(null);
        hasMoreRef.current = true;
        setHasMore(true);
        void loadNextPage();
    }, [loadNextPage]);

    const sentinelRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }

            if (!node) {
                sentinelInViewRef.current = false;
                return;
            }

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0];

                    if (!entry) {
                        return;
                    }

                    sentinelInViewRef.current = entry.isIntersecting;

                    if (
                        entry.isIntersecting &&
                        hasMoreRef.current &&
                        !isLoadingRef.current
                    ) {
                        void loadNextPage();
                    }
                },
                {
                    threshold: 0,
                    rootMargin: '500px 0px',
                }
            );

            observerRef.current.observe(node);
        },
        [loadNextPage]
    );

    useEffect(() => {
        generationRef.current++;

        moviesRef.current = [];
        nextPageRef.current = 0;
        isLoadingRef.current = false;
        hasMoreRef.current = true;
        sentinelInViewRef.current = false;
        loadedPagesRef.current = new Set();

        setMovies([]);
        setIsLoading(false);
        setHasMore(true);
        setError(null);

        void loadNextPage();

        return () => {
            generationRef.current++;

            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [loadNextPage]);

    const showEmpty =
        movies.length === 0 &&
        !isLoading &&
        !error &&
        !hasMore;

    return (
        <>
            {movies.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {movies.map((movie) => (
                        <MovieCard key={movie.publicId} movie={movie} />
                    ))}
                </div>
            )}

            {showEmpty && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-400">
                    Không tìm thấy phim nào.
                </div>
            )}

            {isLoading && (
                <div className="mt-8 flex justify-center">
                    <div className="inline-flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                        <span className="text-zinc-400">Đang tải thêm...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-red-400">
                    <div>Lỗi khi tải phim: {error}</div>
                    <button
                        type="button"
                        onClick={retryLoad}
                        className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {hasMore && !error && (
                <div ref={sentinelRef} className="mt-8 h-12 w-full" />
            )}

            {!hasMore && movies.length > 0 && !error && (
                <div className="mt-8 text-center text-zinc-400">
                    Đã hiển thị tất cả {movies.length} phim
                </div>
            )}
        </>
    );
}