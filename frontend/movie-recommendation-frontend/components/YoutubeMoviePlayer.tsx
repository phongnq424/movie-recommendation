"use client";

import { useRef, useState } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { movieService } from "@/services/movie.service";

interface YoutubeMoviePlayerProps {
    movieUrl: string;
    moviePublicId: string;
}

export function YoutubeMoviePlayer({ movieUrl, moviePublicId }: YoutubeMoviePlayerProps) {
    const [hasCountedView, setHasCountedView] = useState(false);
    const [hasTrackedFinish, setHasTrackedFinish] = useState(false);

    const playerRef = useRef<any>(null);

    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = getYouTubeId(movieUrl);

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
        try {
            if (!hasCountedView) {
                setHasCountedView(true);

                await movieService.increaseViewCount(moviePublicId);

                await movieService.trackInteraction(moviePublicId, {
                    interactionType: "PLAY",
                    value: 1,
                });

                console.log("Successfully registered view and PLAY interaction:", moviePublicId);
                return;
            }

            await movieService.trackInteraction(moviePublicId, {
                interactionType: "PLAY",
                value: 0.3,
            });
        } catch (error) {
            console.error("Failed to track PLAY interaction:", error);
        }
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
        if (hasTrackedFinish) {
            return;
        }

        try {
            setHasTrackedFinish(true);

            const progressData = getProgressData();

            await movieService.trackInteraction(moviePublicId, {
                interactionType: "FINISH_WATCHING",
                value: 1,
                watchedSeconds: progressData.durationSeconds,
                durationSeconds: progressData.durationSeconds,
                progressPercent: 100,
            });

            console.log("Successfully registered FINISH_WATCHING interaction:", moviePublicId);
        } catch (error) {
            console.error("Failed to track FINISH_WATCHING interaction:", error);
        }
    };

    if (!videoId) {
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
        <div className="w-full h-full">
            <YouTube
                videoId={videoId}
                opts={opts}
                onReady={onReady}
                onPlay={onPlayerPlay}
                onPause={onPlayerPause}
                onEnd={onPlayerEnd}
                className="w-full h-full flex items-center justify-center"
                iframeClassName="w-full h-full aspect-video border-0"
            />
        </div>
    );
}