'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { movieService } from '@/services/movie.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import Image from 'next/image';

export default function MoviesPage() {
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);

  useEffect(() => {
    const userInfoStr = localStorage.getItem('user_info');

    if (!userInfoStr) {
      return;
    }

    try {
      const userInfo = JSON.parse(userInfoStr);
      setCurrentRoles(userInfo.roles ?? []);
      setCurrentPermissions(userInfo.permissions ?? []);
    } catch {
      setCurrentRoles([]);
      setCurrentPermissions([]);
    }
  }, []);

  const hasPermission = (permission: string) => {
    return currentRoles.includes('ADMIN') || currentPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]) => {
    return currentRoles.includes('ADMIN') || permissions.some((permission) => currentPermissions.includes(permission));
  };

  const canCreateMovie = hasPermission('MOVIE_CREATE');
  const canUpdateMovie = hasPermission('MOVIE_UPDATE');
  const canDeleteMovie = hasPermission('MOVIE_DELETE');
  const canChangeMovieStatus = hasPermission('MOVIE_CHANGE_STATUS');
  const canManageReviews = hasAnyPermission(['REVIEW_READ_ADMIN', 'REVIEW_MODERATE']);

  const canShowActions =
    canUpdateMovie ||
    canDeleteMovie ||
    canChangeMovieStatus ||
    canManageReviews;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setPage(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['movies', debouncedKeyword, page, pageSize],
    queryFn: () => {
      if (debouncedKeyword) {
        return movieService.searchMoviesPaginated(
          debouncedKeyword,
          page,
          pageSize
        );
      }

      return movieService.getAllMoviesPaginated(page, pageSize);
    },
  });

  const movies = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const isFirstPage = data?.first ?? page === 0;
  const isLastPage = data?.last ?? true;

  const statusMutation = useMutation({
    mutationFn: (payload: { publicId: string; status: string }) =>
      movieService.updateMovieStatus(payload.publicId, payload.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => movieService.softDeleteMovie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });

  if (isLoading) {
    return <div className="p-8">Đang tải...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold">Quản lý Phim</h1>

        <div className="flex w-full items-center gap-4 sm:w-auto">
          <Input
            placeholder="Tìm kiếm phim..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full border-white/10 bg-white/5 sm:w-64"
          />

          {canCreateMovie && (
            <Link href="/admin/movies/create">
              <Button className="whitespace-nowrap bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 h-4 w-4" />
                Thêm Phim Mới
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm text-zinc-400">
        <div>
          Tổng cộng: <span className="font-semibold text-white">{totalElements}</span> phim
        </div>

        {isFetching && (
          <div className="text-zinc-500">Đang cập nhật...</div>
        )}
      </div>

      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-[60px] text-zinc-300">Poster</TableHead>
              <TableHead className="text-zinc-300">Tên phim</TableHead>
              <TableHead className="text-zinc-300">Năm / Thời lượng</TableHead>
              <TableHead className="text-zinc-300">Trạng thái</TableHead>
              <TableHead className="text-right text-zinc-300">Thao tác</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {movies.map((movie) => (
              <TableRow
                key={movie.publicId}
                className="border-white/10 hover:bg-white/5"
              >
                <TableCell>
                  {movie.posterUrl ? (
                    <div className="relative h-14 w-10 overflow-hidden rounded border border-white/10">
                      <Image
                        src={movie.posterUrl}
                        alt={movie.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-10 items-center justify-center rounded bg-white/10 text-xs text-zinc-500">
                      No img
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="font-medium">{movie.title}</div>
                  <div className="text-xs text-zinc-500">
                    {movie.originalTitle}
                  </div>
                </TableCell>

                <TableCell className="text-zinc-400">
                  {movie.releaseYear} • {movie.durationMinutes ?? 'N/A'} phút
                  <div className="mt-1 inline-block rounded bg-white/10 px-1.5 text-xs">
                    {movie.quality ?? 'N/A'}
                  </div>
                </TableCell>

                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${movie.status === 'PUBLISHED'
                        ? 'bg-green-500/10 text-green-500'
                        : movie.status === 'DELETED'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}
                  >
                    {movie.status}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  {canShowActions ? (
                    <div className="flex justify-end gap-2">
                      {canManageReviews && (
                        <Link href={`/admin/movies/${movie.publicId}/reviews`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-purple-400 hover:bg-white/10"
                            title="Quản lý đánh giá"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}

                      {canChangeMovieStatus && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={statusMutation.isPending}
                          onClick={() => {
                            const newStatus =
                              movie.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

                            statusMutation.mutate({
                              publicId: movie.publicId,
                              status: newStatus,
                            });
                          }}
                          className="hover:bg-white/10 disabled:opacity-50"
                          title={
                            movie.status === 'PUBLISHED'
                              ? 'Ẩn phim'
                              : 'Xuất bản phim'
                          }
                        >
                          {movie.status === 'PUBLISHED' ? (
                            <EyeOff className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      )}

                      {canUpdateMovie && (
                        <Link href={`/admin/movies/${movie.publicId}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-400 hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}

                      {canDeleteMovie && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa phim này?')) {
                              deleteMutation.mutate(movie.publicId);
                            }
                          }}
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-zinc-500 italic">
                      Không có quyền
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {movies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-zinc-500"
                >
                  Chưa có phim nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="text-sm text-zinc-400">
          Trang {totalPages === 0 ? 0 : page + 1} / {totalPages}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={isFirstPage || isFetching}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Trước
          </Button>

          <Button
            variant="outline"
            disabled={isLastPage || isFetching}
            onClick={() => setPage((prev) => prev + 1)}
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            Sau
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}