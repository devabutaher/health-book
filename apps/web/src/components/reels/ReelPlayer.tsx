"use client";

import { Heart, Loader2, Play, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export function ReelPlayer({
  videoUrl,
  isActive,
  onDoubleTapLike,
  thumbnailUrl,
}: {
  videoUrl: string;
  isActive?: boolean;
  onDoubleTapLike?: () => void;
  thumbnailUrl?: string | null;
}) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTap = useRef(0);
  const heartTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const singleTapTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(heartTimeout.current);
      clearTimeout(singleTapTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {
        setMuted(true);
        videoRef.current?.play().catch(() => {});
      });
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  const handlePlayPause = useCallback(() => {
    if (playingRef.current) videoRef.current?.pause();
    else videoRef.current?.play();
    setPlaying((p) => !p);
  }, []);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted(!muted);
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      const now = Date.now();
      const timeSince = now - lastTap.current;

      if (timeSince < 300 && timeSince > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setHeartPosition({ x, y });
        setShowHeart(true);
        clearTimeout(heartTimeout.current);
        heartTimeout.current = setTimeout(() => setShowHeart(false), 800);
        onDoubleTapLike?.();
        lastTap.current = 0;
        clearTimeout(singleTapTimeout.current);
      } else {
        lastTap.current = now;
        clearTimeout(singleTapTimeout.current);
        singleTapTimeout.current = setTimeout(() => {
          if (lastTap.current !== 0) {
            handlePlayPause();
            lastTap.current = 0;
          }
        }, 300);
      }
    },
    [onDoubleTapLike, handlePlayPause],
  );

  return (
    <>
      <video
        ref={videoRef}
        src={videoUrl}
        className="h-full w-full object-cover"
        autoPlay
        loop
        playsInline
        muted={muted}
        onClick={handleClick}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        poster={thumbnailUrl || undefined}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="size-8 animate-spin text-white/70" />
        </div>
      )}

      {/* Volume toggle */}
      <button
        onClick={handleToggleMute}
        className="absolute left-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>

      {/* Play overlay */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
            onClick={handlePlayPause}
            aria-label="Play"
          >
            <div className="flex size-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <Play className="size-8 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-tap heart animation */}
      {showHeart && (
        <div
          className="absolute pointer-events-none animate-heart-burst"
          style={{ left: heartPosition.x - 32, top: heartPosition.y - 32 }}
        >
          <Heart className="size-16 fill-white text-white drop-shadow-2xl" />
        </div>
      )}
    </>
  );
}
