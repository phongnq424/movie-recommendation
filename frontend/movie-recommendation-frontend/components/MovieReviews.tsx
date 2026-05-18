'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/review.service';
import { userService } from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Image from 'next/image';

export function MovieReviews({ moviePublicId }: { moviePublicId: string }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = Cookies.get('access_token');
    const userInfoStr = localStorage.getItem('user_info');
    if (token && userInfoStr) {
      setIsAuthenticated(true);
      try {
        setUser(JSON.parse(userInfoStr));
      } catch (e) {}
    }
  }, []);

  const { data: currentUserData } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => userService.getCurrentUser(),
    enabled: isAuthenticated
  });

  const [content, setContent] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', 'published', moviePublicId],
    queryFn: () => reviewService.getPublishedReviewsByMovie(moviePublicId),
    enabled: !!moviePublicId
  });

  const mutation = useMutation({
    mutationFn: (data: { moviePublicId: string; content: string; spoiler: boolean }) => 
      reviewService.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'published', moviePublicId] });
      setContent('');
      setSpoiler(false);
      // Có thể thêm toast thông báo ở đây nếu cần thiết
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate({
      moviePublicId,
      content,
      spoiler
    });
  };

  const toggleSpoiler = (reviewId: number) => {
    setRevealedSpoilers(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold border-b border-white/10 pb-4">Đánh giá phim ({reviews.length})</h2>

      {/* Form đăng đánh giá */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            {currentUserData?.avatarUrl ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10">
                <Image src={currentUserData.avatarUrl} alt={currentUserData.fullName || 'User'} fill className="object-cover" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <div className="font-medium text-white">{user?.fullName || 'Người dùng'}</div>
              <div className="text-xs text-zinc-400">Chia sẻ cảm nghĩ của bạn về bộ phim này</div>
            </div>
          </div>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết đánh giá của bạn..."
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-[#08080a] p-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(e) => setSpoiler(e.target.checked)}
                className="rounded border-white/20 bg-[#08080a] text-red-600 focus:ring-red-500/50 focus:ring-offset-0"
              />
              <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition">
                Chứa nội dung Spoil (Tiết lộ tình tiết)
              </span>
            </label>
            <Button 
              type="submit" 
              disabled={mutation.isPending || !content.trim()} 
              className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6"
            >
              {mutation.isPending ? 'Đang gửi...' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Gửi đánh giá
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-zinc-400 mb-4">Bạn cần đăng nhập để tham gia bình luận và đánh giá phim.</p>
          <Link href="/login">
            <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8">
              Đăng nhập ngay
            </Button>
          </Link>
        </div>
      )}

      {/* Danh sách đánh giá */}
      <div className="space-y-6 pt-4">
        {isLoading ? (
          <div className="text-center py-8 text-zinc-500 animate-pulse">Đang tải đánh giá...</div>
        ) : reviews.length > 0 ? (
          reviews.map((review: any) => {
            const isSpoiler = review.spoiler;
            const isRevealed = revealedSpoilers[review.id];

            return (
              <div key={review.id} className="flex gap-4 p-6 rounded-xl bg-white/5 border border-white/5 transition hover:bg-white/10">
                <div className="shrink-0">
                  {review.userAvatarUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10">
                      <Image src={review.userAvatarUrl} alt={review.userFullName || 'User'} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-lg border border-white/10">
                      {review.userFullName?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-lg">{review.userFullName}</h4>
                      <div className="text-xs text-zinc-500">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {isSpoiler && !isRevealed && (
                      <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-500 border border-yellow-500/20">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Spoiler
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    {isSpoiler && !isRevealed ? (
                      <div className="relative overflow-hidden rounded-lg bg-[#08080a] border border-white/10 p-6 flex flex-col items-center justify-center gap-3">
                        <ShieldAlert className="h-8 w-8 text-yellow-500 opacity-50" />
                        <p className="text-sm text-zinc-400 text-center max-w-sm">
                          Bình luận này có chứa nội dung tiết lộ trước cốt truyện (Spoiler).
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleSpoiler(review.id)}
                          className="mt-2 border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-full"
                        >
                          Vẫn xem nội dung
                        </Button>
                      </div>
                    ) : (
                      <p className="text-zinc-300 leading-relaxed whitespace-pre-line text-[15px]">
                        {review.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white/5 border border-white/5 rounded-xl">
            <MessageSquare className="h-12 w-12 text-zinc-600 mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium text-zinc-300">Chưa có đánh giá nào</h3>
            <p className="text-sm text-zinc-500 mt-1">Hãy là người đầu tiên chia sẻ cảm nghĩ về bộ phim này!</p>
          </div>
        )}
      </div>
    </div>
  );
}
