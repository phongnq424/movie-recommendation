"use client";

import { useRef, useState } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { Play } from "lucide-react";
import { movieService } from "@/services/movie.service";

interface YoutubeMoviePlayerProps {
    movieUrl: string;
    moviePublicId: string;
}

export function YoutubeMoviePlayer({
    movieUrl,
    moviePublicId,
}: YoutubeMoviePlayerProps) {
    const [fallbackStarted, setFallbackStarted] = useState(false);

    const playerRef = useRef<any>(null);
    const hasTrackedPlayRef = useRef(false);
    const hasTrackedFinishRef = useRef(false);

    const getYouTubeId = (url: string) => {
        if (!url) return null;

        const regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

        const match = url.match(regExp);

        return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = getYouTubeId(movieUrl);

    const trackPlayOnce = async () => {
        if (hasTrackedPlayRef.current || !moviePublicId) {
            return;
        }

        hasTrackedPlayRef.current = true;

        try {
            await movieService.increaseViewCount(moviePublicId);
            console.log("Successfully increased view count:", moviePublicId);
        } catch (error) {
            console.error("Failed to increase view count:", error);
        }

        try {
            await movieService.trackInteraction(moviePublicId, {
                interactionType: "PLAY",
                value: 1,
            });

            console.log("Successfully registered PLAY interaction:", moviePublicId);
        } catch (error) {
            console.error("Failed to track PLAY interaction:", error);
        }
    };

    const onReady: YouTubeProps["onReady"] = (event) => {
        playerRef.current = event.target;
    };

    const getProgressData = () => {
        const player = playerRef.current;

        if (!player) {
            return {
                watchedSeconds: undefined,
                durationSeconds: undefined,
                progressPercent: undefined,
            };
        }

        const watchedSeconds = Math.floor(player.getCurrentTime());
        const durationSeconds = Math.floor(player.getDuration());

        const progressPercent =
            durationSeconds > 0
                ? Math.floor((watchedSeconds / durationSeconds) * 100)
                : 0;

        return {
            watchedSeconds,
            durationSeconds,
            progressPercent,
        };
    };

    const onPlayerPlay: YouTubeProps["onPlay"] = async () => {
        await trackPlayOnce();
    };

    const onPlayerPause: YouTubeProps["onPause"] = async () => {
        try {
            const progressData = getProgressData();

            await movieService.trackInteraction(moviePublicId, {
                interactionType: "PAUSE",
                value: 0.1,
                watchedSeconds: progressData.watchedSeconds,
                durationSeconds: progressData.durationSeconds,
                progressPercent: progressData.progressPercent,
            });

            console.log("Successfully registered PAUSE interaction:", moviePublicId);
        } catch (error) {
            console.error("Failed to track PAUSE interaction:", error);
        }
    };

    const onPlayerEnd: YouTubeProps["onEnd"] = async () => {
        if (hasTrackedFinishRef.current) {
            return;
        }

        hasTrackedFinishRef.current = true;

        try {
            const progressData = getProgressData();

            await movieService.trackInteraction(moviePublicId, {
                interactionType: "FINISH_WATCHING",
                value: 1,
                watchedSeconds: progressData.durationSeconds,
                durationSeconds: progressData.durationSeconds,
                progressPercent: 100,
            });

            console.log(
                "Successfully registered FINISH_WATCHING interaction:",
                moviePublicId
            );
        } catch (error) {
            console.error("Failed to track FINISH_WATCHING interaction:", error);
        }
    };

    if (!videoId) {
        if (!fallbackStarted) {
            return (
                <div className="flex h-full w-full items-center justify-center bg-black">
                    <button
                        type="button"
                        onClick={async () => {
                            setFallbackStarted(true);
                            await trackPlayOnce();
                        }}
                        className="inline-flex items-center gap-3 rounded-2xl bg-red-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-red-500 active:scale-95"
                    >
                        <Play className="h-5 w-5" />
                        Xem phim
                    </button>
                </div>
            );
        }

        return (
            <iframe
                src={movieUrl}
                className="h-full w-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
        );
    }

    const opts: YouTubeProps["opts"] = {
        height: "100%",
        width: "100%",
        playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
        },
    };

    return (
        <div className="h-full w-full">
            <YouTube
                videoId={videoId}
                opts={opts}
                onReady={onReady}
                onPlay={onPlayerPlay}
                onPause={onPlayerPause}
                onEnd={onPlayerEnd}
                className="flex h-full w-full items-center justify-center"
                iframeClassName="h-full w-full aspect-video border-0"
            />
        </div>
    );
}