'use client';

import MovieForm from '../../_components/MovieForm';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movie.service';

export default function EditMoviePage() {
  const params = useParams();
  const id = params.id as string;

  const { data: movie, isLoading } = useQuery({
    queryKey: ['movies', id],
    queryFn: () => movieService.getMovieDetail(id),
    enabled: !!id
  });

  if (isLoading) return <div className="p-8">Đang tải dữ liệu phim...</div>;
  if (!movie) return <div className="p-8">Không tìm thấy phim</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Sửa Phim: {movie.title}</h1>
      <div className="bg-[#111114] border border-white/10 rounded-xl p-6">
        <MovieForm initialData={movie} movieId={id} />
      </div>
    </div>
  );
}
