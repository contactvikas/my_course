"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSession, openAuth, api } from "@/lib/useSession";
import Nav from "@/components/Nav";

const features = [
  ["Comprehensive Curriculum", "Aligned with the latest industry trends.", "#e3f0ff"],
  ["Expert Trainers", "Learn from people who do this at work.", "#efe3ff"],
  ["Online Classes", "Learn from anywhere, at your pace.", "#ffe3ec"],
  ["Hands-On Projects", "Build real projects for your portfolio.", "#f6e3ff"],
  ["Performance Tracking", "Track progress with assessments.", "#fff0e0"],
  ["Placement Assistance", "Interview and job support.", "#e3f6e8"],
];
const faqs = [
  ["Is the training in Telugu or English?", "Edit this answer to match your courses."],
  ["Will I get a certificate?", "Edit this answer to match your courses."],
  ["Can I download the videos?", "Videos stream only on this website, with your name as a watermark."],
];

export default function Home() {
  const { session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  useEffect(() => { supabase.from("courses").select("*").then(({ data }) => setCourses(data || [])); }, [session]);

  const enroll = async (id: string) => {
    if (!session) return openAuth();
    await api("/api/purchase-demo", session.access_token, { courseId: id });
    router.push("/dashboard");
  };

  return (
    <>
      <Nav />
      <section className="hero">
        <div>
          <h1>REAL SKILLS. REAL IMPACT. YOUR CAREER STARTS HERE.</h1>
          <p>Industry-focused video courses with hands-on projects, streamed securely on this site.</p>
          <a className="yellow" href="#courses">EXPLORE MORE</a>
        </div>
      </section>
      <section className="wrap" id="courses">
        <h2 className="title">Our Current Courses</h2>
        <div className="grid3">
          {courses.map((c) => (
            <div key={c.id} className="card course-card">
              <Link href={`/course/${c.id}`} className="course-card__link">
                <div className="thumb">{c.title}</div>
                <h3>{c.title}</h3>
                <p className="muted">{c.description}</p>
                <p className="course-price"><b>₹{c.price_inr}</b></p>
              </Link>
              <div className="course-card__actions">
                <Link className="yellow" href={`/course/${c.id}`}>VIEW COURSE</Link>
                <button className="outline" onClick={() => enroll(c.id)}>{session ? "ENROLL" : "KNOW MORE"}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="wrap">
        <h2 className="title">Why choose us</h2>
        <div className="grid3">
          {features.map(([t, d, c]) => (
            <div key={t} className="feat" style={{ background: c }}><b>{t}</b><p>{d}</p></div>
          ))}
        </div>
      </section>
      <section className="wrap" id="faq">
        <h2 className="title">Quick answers</h2>
        {faqs.map(([q, a]) => (<details key={q}><summary>{q}</summary><p>{a}</p></details>))}
      </section>
    </>
  );
}
