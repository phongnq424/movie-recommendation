'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movie.service';
import { genreService } from '@/services/genre.service';
import { actorService } from '@/services/actor.service';
import type { MovieStatus } from '@/types/movie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2 } from 'lucide-react';

type ActorEntry = { actorPublicId: string; characterName: string; mainCast: boolean };

type MovieInfoFields = {
  title: string;
  originalTitle: string;
  description: string;
  releaseYear: number;
  durationMinutes: number;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  movieUrl: string;
  quality: string;
  ageRating: string;
  status: MovieStatus;
};

const sectionClass = 'space-y-4 rounded-xl border border-white/10 bg-[#0d0d10] p-6';
const sectionHeaderClass = 'flex items-center justify-between border-b border-white/10 pb-3';

function SectionSaveButton({
  isPending,
  isSuccess,
  label = 'Lưu lại',
}: {
  isPending: boolean;
  isSuccess: boolean;
  label?: string;
}) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      className="min-w-[120px] bg-red-600 hover:bg-red-700 disabled:opacity-60"
    >
      {isPending ? (
        <span className="flex items-center gap-1.5">
          <Loader2 size={14} className="animate-spin" /> Đang lưu...
        </span>
      ) : isSuccess ? (
        <span className="flex items-center gap-1.5">
          <CheckCircle size={14} className="text-green-400" /> Đã lưu
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

export default function MovieForm({
  initialData = null,
  movieId = null,
}: {
  initialData?: any;
  movieId?: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!movieId;

  const [info, setInfo] = useState<MovieInfoFields>({
    title: '',
    originalTitle: '',
    description: '',
    releaseYear: new Date().getFullYear(),
    durationMinutes: 120,
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    movieUrl: '',
    quality: 'FHD',
    ageRating: 'P',
    status: 'DRAFT',
  });

  const [genreIds, setGenreIds] = useState<string[]>([]);

  const [actors, setActors] = useState<ActorEntry[]>([]);

  useEffect(() => {
    if (!initialData) return;
    setInfo({
      title: initialData.title || '',
      originalTitle: initialData.originalTitle || '',
      description: initialData.description || '',
      releaseYear: initialData.releaseYear || new Date().getFullYear(),
      durationMinutes: initialData.durationMinutes || 120,
      posterUrl: initialData.posterUrl || '',
      backdropUrl: initialData.backdropUrl || '',
      trailerUrl: initialData.trailerUrl || '',
      movieUrl: initialData.movieUrl || '',
      quality: initialData.quality || 'FHD',
      ageRating: initialData.ageRating || 'P',
      status: initialData.status || 'DRAFT',
    });
    setGenreIds(initialData.genres?.map((g: any) => g.genrePublicId) ?? []);
    setActors(
      initialData.actors?.map((a: any) => ({
        actorPublicId: a.actorPublicId,
        characterName: a.characterName || '',
        mainCast: a.mainCast || false,
      })) ?? []
    );
  }, [initialData]);

  const { data: genres = [] } = useQuery({
    queryKey: ['genres', 'all'],
    queryFn: () => genreService.getAllGenres(),
  });

  const { data: actorsList = [] } = useQuery({
    queryKey: ['actors', 'all'],
    queryFn: () => actorService.getAllActors(),
  });

  const infoMutation = useMutation({
    mutationFn: async (data: MovieInfoFields) => {
      if (isEditing) {
        await movieService.updateMovie(movieId!, data);
        return movieId!;
      } else {
        const created = await movieService.createMovie(data);
        return created.publicId;
      }
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      if (!isEditing) {
        router.push(`/admin/movies/${newId}/edit`);
      }
    },
  });

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    infoMutation.mutate(info);
  };

  const genreMutation = useMutation({
    mutationFn: () => movieService.setGenresForMovie(movieId!, genreIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['movies'] }),
  });

  const handleGenreToggle = (id: string) =>
    setGenreIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const actorMutation = useMutation({
    mutationFn: () =>
      movieService.setActorsForMovie(
        movieId!,
        actors.map((a, i) => ({
          actorPublicId: a.actorPublicId,
          characterName: a.characterName,
          mainCast: a.mainCast,
          castOrder: i + 1,
        }))
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['movies'] }),
  });

  const addActor = () =>
    setActors((prev) => [...prev, { actorPublicId: '', characterName: '', mainCast: false }]);

  const removeActor = (index: number) =>
    setActors((prev) => prev.filter((_, i) => i !== index));

  const updateActor = (index: number, field: string, value: any) =>
    setActors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

  return (
    <div className="space-y-6">

      {/* ── Section 1: Movie Info ── */}
      <form onSubmit={handleInfoSubmit} className={sectionClass}>
        <div className={sectionHeaderClass}>
          <h2 className="text-xl font-semibold">Thông tin phim</h2>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => router.push('/admin/movies')}
              variant="outline"
              className="bg-transparent border-white/10 hover:bg-white/5"
            >
              Hủy bỏ
            </Button>
            <SectionSaveButton isPending={infoMutation.isPending} isSuccess={infoMutation.isSuccess} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left */}
          <div className="space-y-4">
            <h3 className="text-base font-medium text-zinc-300 border-b border-white/5 pb-1">Thông tin cơ bản</h3>
            <div className="space-y-2">
              <Label htmlFor="title">Tên phim *</Label>
              <Input required id="title" value={info.title} onChange={e => setInfo({ ...info, title: e.target.value })} className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalTitle">Tên gốc</Label>
              <Input id="originalTitle" value={info.originalTitle} onChange={e => setInfo({ ...info, originalTitle: e.target.value })} className="bg-white/5 border-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="releaseYear">Năm phát hành *</Label>
                <Input type="number" required id="releaseYear" value={info.releaseYear} onChange={e => setInfo({ ...info, releaseYear: parseInt(e.target.value) })} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Thời lượng (phút) *</Label>
                <Input type="number" required id="durationMinutes" value={info.durationMinutes} onChange={e => setInfo({ ...info, durationMinutes: parseInt(e.target.value) })} className="bg-white/5 border-white/10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả nội dung</Label>
              <textarea id="description" rows={4} value={info.description} onChange={e => setInfo({ ...info, description: e.target.value })} className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Chất lượng</Label>
                <select
                  value={info.quality}
                  onChange={e => setInfo({ ...info, quality: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  <option value="FHD" className="bg-zinc-900 text-white">FHD</option>
                  <option value="HD" className="bg-zinc-900 text-white">HD</option>
                  <option value="4K" className="bg-zinc-900 text-white">4K</option>
                  <option value="CAM" className="bg-zinc-900 text-white">CAM</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Độ tuổi</Label>
                <select
                  value={info.ageRating}
                  onChange={e => setInfo({ ...info, ageRating: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  <option value="P" className="bg-zinc-900 text-white">P (Mọi lứa tuổi)</option>
                  <option value="C13" className="bg-zinc-900 text-white">C13 (13+)</option>
                  <option value="C16" className="bg-zinc-900 text-white">C16 (16+)</option>
                  <option value="C18" className="bg-zinc-900 text-white">C18 (18+)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Trạng thái</Label>
                <select
                  value={info.status}
                  onChange={e => setInfo({ ...info, status: e.target.value as MovieStatus })}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  <option value="DRAFT" className="bg-zinc-900 text-white">Draft</option>
                  <option value="PUBLISHED" className="bg-zinc-900 text-white">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <h3 className="text-base font-medium text-zinc-300 border-b border-white/5 pb-1">Media &amp; URL</h3>
            <div className="space-y-2">
              <Label htmlFor="posterUrl">Poster URL</Label>
              <Input id="posterUrl" value={info.posterUrl} onChange={e => setInfo({ ...info, posterUrl: e.target.value })} className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backdropUrl">Backdrop URL</Label>
              <Input id="backdropUrl" value={info.backdropUrl} onChange={e => setInfo({ ...info, backdropUrl: e.target.value })} className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trailerUrl">Trailer URL</Label>
              <Input id="trailerUrl" value={info.trailerUrl} onChange={e => setInfo({ ...info, trailerUrl: e.target.value })} className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="movieUrl">Nguồn phim (Movie URL) *</Label>
              <Input required id="movieUrl" value={info.movieUrl} onChange={e => setInfo({ ...info, movieUrl: e.target.value })} className="bg-white/5 border-white/10" />
            </div>
          </div>
        </div>
      </form>

      {/* ── Sections 2 & 3: only in edit mode ── */}
      {isEditing && (
        <>
          {/* ── Section 2: Genres ── */}
          <div className={sectionClass}>
            <div className={sectionHeaderClass}>
              <h2 className="text-xl font-semibold">Thể loại</h2>
              <Button
                type="button"
                disabled={genreMutation.isPending}
                onClick={() => genreMutation.mutate()}
                className="min-w-[120px] bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {genreMutation.isPending ? (
                  <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Đang lưu...</span>
                ) : genreMutation.isSuccess ? (
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> Đã lưu</span>
                ) : 'Lưu thể loại'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map(genre => (
                <div
                  key={genre.publicId}
                  onClick={() => handleGenreToggle(genre.publicId)}
                  className={`cursor-pointer px-3 py-1.5 rounded-full text-sm border transition-colors ${genreIds.includes(genre.publicId)
                    ? 'bg-red-600/20 border-red-500 text-red-400'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                    }`}
                >
                  {genre.name}
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 3: Actors ── */}
          <div className={sectionClass}>
            <div className={sectionHeaderClass}>
              <h2 className="text-xl font-semibold">Diễn viên</h2>
              <div className="flex items-center gap-3">
                <Button type="button" onClick={addActor} variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10">
                  + Thêm diễn viên
                </Button>
                <Button
                  type="button"
                  disabled={actorMutation.isPending}
                  onClick={() => actorMutation.mutate()}
                  className="min-w-[120px] bg-red-600 hover:bg-red-700 disabled:opacity-60"
                >
                  {actorMutation.isPending ? (
                    <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Đang lưu...</span>
                  ) : actorMutation.isSuccess ? (
                    <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> Đã lưu</span>
                  ) : 'Lưu diễn viên'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {actors.map((actor, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <select
                      required
                      value={actor.actorPublicId}
                      onChange={e => updateActor(index, 'actorPublicId', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-[#111114] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    >
                      <option value="">-- Chọn diễn viên --</option>
                      {actorsList.map((a: any) => (
                        <option key={a.publicId} value={a.publicId}>{a.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Tên nhân vật"
                      value={actor.characterName}
                      onChange={e => updateActor(index, 'characterName', e.target.value)}
                      className="bg-[#111114] border-white/10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`mainCast-${index}`}
                      checked={actor.mainCast}
                      onChange={e => updateActor(index, 'mainCast', e.target.checked)}
                    />
                    <Label htmlFor={`mainCast-${index}`} className="text-sm">Vai chính</Label>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeActor(index)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                    Xóa
                  </Button>
                </div>
              ))}
              {actors.length === 0 && (
                <p className="text-sm text-zinc-500 italic">Chưa có diễn viên nào được thêm vào phim.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
