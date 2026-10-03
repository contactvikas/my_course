"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Player from "@/components/Player";

type Course = { id: string; title: string; description: string; price_inr: number };
type Stream = { src: string; query: string; label: string };

const deviceId = () => {
  let id = localStorage.getItem("device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("device_id", id); }
  return id;
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [stream, setStream] = useState<Stream | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = async () => {
    const { data: c } = await supabase.from("courses").select("*");
    const { data: p } = await supabase.from("purchases").select("course_id");
    setCourses(c || []); setOwned((p || []).map((x: any) => x.course_id));
  };
  useEffect(() => { if (session) load(); }, [session]);

  const api = (path: string, body: any) =>
    fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body) });

  const auth = async (mode: "in" | "up") => {
    setMsg("");
    const fn = mode === "in" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { error } = await fn.call(supabase.auth, { email, password });
    if (error) setMsg(error.message);
    else if (mode === "up") setMsg("Account created. Check your email to confirm, then sign in.");
  };

  const buy = async (id: string) => { await api("/api/purchase-demo", { courseId: id }); load(); };

  const play = async (id: string, claim = true) => {
    const r = await api("/api/access", { courseId: id, deviceId: deviceId(), claim });
    const j = await r.json();
    if (!r.ok) { setPlaying(null); setStream(null); setMsg(j.error); return; }
    if (claim) { setPlaying(id); setStream(j); setMsg(""); }
  };

  // Heartbeat: stop playback if another device took over
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => play(playing, false), 45000);
    return () => clearInterval(t);
  }, [playing, session]);

  if (!ready) return null;

  if (!session) return (
    <main>
      <h1>Sign in</h1>
      <p className="muted">Create an account or sign in to see your courses.</p>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="row">
        <button onClick={() => auth("in")}>Sign in</button>
        <button className="ghost" onClick={() => auth("up")}>Create account</button>
      </div>
      <p className="err">{msg}</p>
    </main>
  );

  return (
    <main>
      <div className="bar">
        <div><h1>Courses</h1><span className="muted">{session.user.email}</span></div>
        <button className="ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
      <div className="banner">Demo mode: "Get for free" skips payment. Razorpay replaces it later.</div>
      {msg && <p className="err">{msg}</p>}
      {courses.map((c) => (
        <section className="course" key={c.id}>
          <h2>{c.title}</h2>
          <p className="muted">{c.description}</p>
          {owned.includes(c.id) ? (
            playing === c.id && stream
              ? <Player key={stream.src} {...stream} />
              : <button onClick={() => play(c.id)}>Watch</button>
          ) : (
            <button onClick={() => buy(c.id)}>Get for free (demo) · ₹{c.price_inr}</button>
          )}
        </section>
      ))}
    </main>
  );
}
