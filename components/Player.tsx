"use client";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type Props = { src: string; query: string; label: string };

export default function Player({ src, query, label }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [pos, setPos] = useState({ top: 12, left: 12 });

  useEffect(() => {
    const v = video.current!;
    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr, url) => {
          xhr.open("GET", query ? url + (url.includes("?") ? "&" : "?") + query : url, true);
        },
      });
      hls.loadSource(src);
      hls.attachMedia(v);
      return () => hls.destroy();
    }
    v.src = src; // Safari native HLS (demo stream only; signed CloudFront needs hls.js path)
  }, [src, query]);

  // Moving watermark
  useEffect(() => {
    const t = setInterval(() => setPos({ top: 8 + Math.random() * 72, left: 4 + Math.random() * 60 }), 4000);
    return () => clearInterval(t);
  }, []);

  // Re-attach watermark if someone removes it from the DOM
  useEffect(() => {
    const el = wrap.current!;
    const mo = new MutationObserver(() => {
      if (!el.querySelector("[data-wm]")) location.reload();
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  return (
    <div ref={wrap} className="player" onContextMenu={(e) => e.preventDefault()}>
      <video ref={video} controls controlsList="nodownload noplaybackrate" disablePictureInPicture playsInline />
      <span data-wm style={{ top: `${pos.top}%`, left: `${pos.left}%` }}>{label}</span>
    </div>
  );
}
