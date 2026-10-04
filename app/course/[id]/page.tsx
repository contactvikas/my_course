"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, api, deviceId } from "@/lib/useSession";
import Player from "@/components/Player";

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const { session, ready } = useSession();
  const router = useRouter();
  const [stream, setStream] = useState<any>(null);
  const [err, setErr] = useState("");

  const call = async (claim: boolean) => {
    const r = await api("/api/access", session.access_token, { courseId: id, deviceId: deviceId(), claim });
    const j = await r.json();
    if (!r.ok) { setStream(null); setErr(j.error || "Error"); return; }
    if (claim) setStream(j);
  };
  useEffect(() => { if (ready && !session) router.replace("/"); if (session) call(true); }, [ready, session]);
  useEffect(() => {
    if (!stream) return;
    const t = setInterval(() => call(false), 45000);
    return () => clearInterval(t);
  }, [stream]);

  return (
    <main className="wrap">
      <Link href="/dashboard">← My Dashboard</Link>
      {err && <p className="err">{err}</p>}
      {stream && <Player key={stream.src} {...stream} />}
    </main>
  );
}
