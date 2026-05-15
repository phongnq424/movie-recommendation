"use client";

import { useState } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { movieService } from "@/services/movie.service";

interface YoutubeMoviePlayerProps {
    movieUrl: string;
    moviePublicId: string;
}

export function YoutubeMoviePlayer({ movieUrl, moviePublicId }: YoutubeMoviePlayerProps) {
    const [hasCountedView, setHasCountedView] = useState(false);

    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = getYouTubeId(movieUrl);

    const onPlayerPlay: YouTubeProps['onPlay'] = async () => {
        if (!hasCountedView) {
            try {
                setHasCountedView(true);
                await movieService.increaseViewCount(moviePublicId);
                console.log("Successfully registered view count update for movie ID:", moviePublicId);
            } catch (error) {
                console.error("Failed to increase view count:", error);
            }
        }
    };

    if (!videoId) {
        // Fallback to native iframe player if not a YouTube URL
        return (
            <iframe
                src={movieUrl}
                className="h-full w-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
        );
    }

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
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
                onPlay={onPlayerPlay}
                className="w-full h-full flex items-center justify-center"
                iframeClassName="w-full h-full aspect-video border-0"
            />
        </div>
    );
}
