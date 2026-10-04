"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { BRAND } from "@/lib/brand";

const side = ["Courses"];

export default function Dashboard() {
  const { session, ready } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { if (ready && !session) router.replace("/"); }, [ready, session]);
  useEffect(() => {
    if (!session) return;
    supabase.from("purchases").select("created_at, courses(*)").then(({ data }) => setRows(data || []));
  }, [session]);
  if (!session) return null;
  const name = session.user.user_metadata?.name || session.user.email;

  return (
    <div className="dash">
      <aside>
        <Link href="/" className="logo">{BRAND}</Link>
        {side.map((s, i) => (<a key={s} className={i === 0 ? "on" : ""}>{s}</a>))}
        <Link href="/#courses" className="store">Visit Store</Link>
        <div className="me"><b>{name}</b><span>Student</span></div>
      </aside>
      <main>
        <div className="dashboard-heading">
          <h1>Active Courses</h1>
          <Link href="/" className="dashboard-home-link" aria-label="Back to Home">
            <Home size={20} strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid3">
          {rows.map((r) => (
            <Link key={r.courses.id} href={`/course/${r.courses.id}`} className="card">
              <div className="thumb">{r.courses.title}</div>
              <h3>{r.courses.title}</h3>
              <div className="bar2"><i style={{ width: "0%" }} /></div>
              <p className="muted">0% completed</p>
            </Link>
          ))}
          {!rows.length && <p className="muted">No courses yet. Enroll from the home page.</p>}
        </div>
      </main>
    </div>
  );
}
