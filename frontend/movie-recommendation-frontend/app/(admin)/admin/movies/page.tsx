'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, EyeOff, MessageSquare } from 'lucide-react';
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['movies', debouncedKeyword],
    queryFn: () => debouncedKeyword ? movieService.searchMovies(debouncedKeyword) : movieService.getAllMovies()
  });

  const statusMutation = useMutation({
    mutationFn: (data: { publicId: string, status: string }) =>
      movieService.updateMovieStatus(data.publicId, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => movieService.softDeleteMovie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    }
  });

  if (isLoading) return <div className="p-8">Đang tải...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Quản lý Phim</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Input
            placeholder="Tìm kiếm phim..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full sm:w-64 bg-white/5 border-white/10"
          />
          <Link href="/admin/movies/create">
            <Button className="bg-red-600 hover:bg-red-700 whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" /> Thêm Phim Mới
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-300 w-[60px]">Poster</TableHead>
              <TableHead className="text-zinc-300">Tên phim</TableHead>
              <TableHead className="text-zinc-300">Năm / Thời lượng</TableHead>
              <TableHead className="text-zinc-300">Trạng thái</TableHead>
              <TableHead className="text-right text-zinc-300">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movies.map((movie: any) => (
              <TableRow key={movie.publicId} className="border-white/10 hover:bg-white/5">
                <TableCell>
                  {movie.posterUrl ? (
                    <div className="relative w-10 h-14 rounded overflow-hidden border border-white/10">
                      <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-14 rounded bg-white/10 flex items-center justify-center text-zinc-500 text-xs">
                      No img
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{movie.title}</div>
                  <div className="text-xs text-zinc-500">{movie.originalTitle}</div>
                </TableCell>
                <TableCell className="text-zinc-400">
                  {movie.releaseYear} • {movie.durationMinutes} phút
                  <div className="text-xs mt-1 bg-white/10 inline-block px-1.5 rounded">{movie.quality}</div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${movie.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                    {movie.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/movies/${movie.publicId}/reviews`}>
                      <Button variant="ghost" size="icon" className="hover:bg-white/10 text-purple-400" title="Quản lý đánh giá">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newStatus = movie.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
                        statusMutation.mutate({ publicId: movie.publicId, status: newStatus });
                      }}
                      className="hover:bg-white/10"
                      title={movie.status === 'PUBLISHED' ? 'Ẩn phim' : 'Xuất bản phim'}
                    >
                      {movie.status === 'PUBLISHED' ? <EyeOff className="h-4 w-4 text-yellow-500" /> : <Eye className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Link href={`/admin/movies/${movie.publicId}/edit`}>
                      <Button variant="ghost" size="icon" className="hover:bg-white/10 text-blue-400">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Bạn có chắc chắn muốn xóa phim này?')) {
                          deleteMutation.mutate(movie.publicId);
                        }
                      }}
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {movies.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  Chưa có phim nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
