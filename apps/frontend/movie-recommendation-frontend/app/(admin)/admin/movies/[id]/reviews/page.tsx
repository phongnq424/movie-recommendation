'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, ShieldAlert, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { reviewService } from '@/services/review.service';
import { movieService } from '@/services/movie.service';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';

export default function MovieReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = params.id as string;
  const queryClient = useQueryClient();

  const { data: movie } = useQuery({
    queryKey: ['movies', movieId],
    queryFn: () => movieService.getMovieDetail(movieId),
    enabled: !!movieId
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', 'movie', movieId],
    queryFn: () => reviewService.getAllReviewsByMovie(movieId),
    enabled: !!movieId
  });

  const statusMutation = useMutation({
    mutationFn: (data: { id: number, status: string }) => 
      reviewService.updateReviewStatus(data.id, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'movie', movieId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewService.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'movie', movieId] });
    }
  });

  if (isLoading) return <div className="p-8">Đang tải danh sách đánh giá...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/movies')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
        <h1 className="text-2xl font-bold">
          Đánh giá phim: <span className="text-red-500">{movie?.title || 'Đang tải...'}</span>
        </h1>
      </div>

      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-300">Người dùng</TableHead>
              <TableHead className="text-zinc-300 w-1/2">Nội dung</TableHead>
              <TableHead className="text-zinc-300">Trạng thái / Spoil</TableHead>
              <TableHead className="text-zinc-300">Ngày đăng</TableHead>
              <TableHead className="text-right text-zinc-300">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review: any) => (
              <TableRow key={review.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {review.userAvatarUrl ? (
                      <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/10">
                        <Image src={review.userAvatarUrl} alt={review.userFullName || 'User'} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">
                        {review.userFullName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <div>{review.userFullName}</div>
                      <div className="text-xs text-zinc-500">ID: {review.userPublicId.substring(0,8)}...</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-zinc-300">{review.content}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      review.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {review.status}
                    </span>
                    {review.spoiler && (
                      <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-500">
                        <ShieldAlert className="h-3 w-3 mr-1" /> Có Spoiler
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        const newStatus = review.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
                        statusMutation.mutate({ id: review.id, status: newStatus });
                      }} 
                      className="hover:bg-white/10"
                      title={review.status === 'PUBLISHED' ? 'Ẩn đánh giá' : 'Duyệt đánh giá'}
                    >
                      {review.status === 'PUBLISHED' ? <XCircle className="h-4 w-4 text-red-400" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        if (confirm('Bạn có chắc chắn muốn xóa đánh giá này vĩnh viễn?')) {
                          deleteMutation.mutate(review.id);
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
            {reviews.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  Phim này chưa có đánh giá nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
