"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";

interface MovieTrailerProps {
    trailerUrl: string;
    movieTitle: string;
}

export function MovieTrailer({ trailerUrl, movieTitle }: MovieTrailerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = getYouTubeId(trailerUrl);

    if (!videoId) {
        // Fallback to standard link if URL cannot be parsed
        return (
            <a
                href={trailerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            >
                Trailer
            </a>
        );
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
                render={
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95 cursor-pointer"
                    />
                }
            >
                Trailer
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl w-[95vw] aspect-video p-0 overflow-hidden border-zinc-800 bg-black flex items-center justify-center shadow-2xl rounded-xl">
                {isOpen && (
                    <iframe
                        width="100%"
                        height="100%"
                        src={embedUrl}
                        title={`${movieTitle} Trailer`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                )}
            </DialogContent>
        </Dialog>
    );
}
