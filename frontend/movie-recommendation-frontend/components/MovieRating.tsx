'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2 } from 'lucide-react';
import { ratingService } from '@/services/rating.service';

interface MovieRatingProps {
    moviePublicId: string;
}

export function MovieRating({ moviePublicId }: MovieRatingProps) {
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [initialRating, setInitialRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUserRating = async () => {
            const userInfoStr = localStorage.getItem('user_info');
            if (!userInfoStr) return;

            const userInfo = JSON.parse(userInfoStr);
            if (!userInfo.userPublicId) return;

            try {
                const allRatings = await ratingService.getRatingsByMovie(moviePublicId);
                const userRating = allRatings.find(r => r.userPublicId === userInfo.userPublicId);

                if (userRating && userRating.ratingValue) {
                    setRating(userRating.ratingValue);
                    setInitialRating(userRating.ratingValue);
                }
            } catch (error) {
                console.error("Failed to fetch user's rating", error);
            }
        };

        fetchUserRating();
    }, [moviePublicId]);

    const handleRate = async (value: number) => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token) {
            router.push('/auth/login');
            return;
        }

        setIsSubmitting(true);
        setRating(value);
        setMessage('');

        try {
            await ratingService.rateMovie({
                moviePublicId,
                ratingValue: value
            });
            setMessage('Cảm ơn bạn đã đánh giá phim!');
            setInitialRating(value);
        } catch (error) {
            console.error('Lỗi khi đánh giá:', error);
            setMessage('Đánh giá thất bại. Vui lòng thử lại.');
            setRating(initialRating);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white">
                Đánh giá của bạn
            </h3>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" disabled={isSubmitting} onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)} onClick={() => handleRate(star)} className="p-1 transition-transform hover:scale-110 disabled:scale-100 disabled:opacity-50">
                        <Star size={32} className={`transition-colors ${(hoveredRating || rating) >= star ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-600 hover:text-zinc-400'}`} />
                    </button>
                ))}
                {isSubmitting && <Loader2 size={20} className="ml-3 animate-spin text-red-500" />}
            </div>
            {message && (
                <p className={`text-sm font-medium ${message.includes('Cảm ơn') ? 'text-green-400' : 'text-red-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}