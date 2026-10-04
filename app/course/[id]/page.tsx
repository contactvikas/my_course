"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession, api, deviceId, openAuth } from "@/lib/useSession";
import Player from "@/components/Player";

const courseCatalog: Record<string, { title: string; subtitle: string; categories: { title: string; lessons: { id: string; title: string; free?: boolean; duration: string }[] }[] }> = {
  demo: {
    title: "Demo course",
    subtitle: "Beginner-friendly Docker and DevOps fundamentals.",
    categories: [
      {
        title: "Chapter One",
        lessons: [
          { id: "demo-lesson-1", title: "Tutorial One", duration: "08:32", free: true },
          { id: "demo-lesson-2", title: "Tutorial Two", duration: "11:14" },
        ],
      },
      {
        title: "Chapter Two",
        lessons: [
          { id: "demo-lesson-3", title: "Tutorial Three", duration: "09:40" },
          { id: "demo-lesson-4", title: "Tutorial Four", duration: "10:55" },
        ],
      },
      {
        title: "Chapter Three",
        lessons: [
          { id: "demo-lesson-5", title: "Tutorial Five", duration: "12:18" },
          { id: "demo-lesson-6", title: "Tutorial Six", duration: "13:02" },
        ],
      },
    ],
  },
};

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const { session, ready } = useSession();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [purchased, setPurchased] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [streamLesson, setStreamLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [advancingLesson, setAdvancingLesson] = useState<any>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const catalog = courseCatalog[id as string] || {
    title: id?.toString().replace(/-/g, " ") || "Course",
    subtitle: "Career-focused learning content built for practical progress.",
    categories: [
      { title: "Chapter One", lessons: [{ id: "lesson-1", title: "Tutorial One", duration: "08:30", free: true }, { id: "lesson-2", title: "Tutorial Two", duration: "11:00" }] },
      { title: "Chapter Two", lessons: [{ id: "lesson-3", title: "Tutorial Three", duration: "12:10" }, { id: "lesson-4", title: "Tutorial Four", duration: "10:25" }] },
      { title: "Chapter Three", lessons: [{ id: "lesson-5", title: "Tutorial Five", duration: "09:15" }, { id: "lesson-6", title: "Tutorial Six", duration: "14:00" }] },
    ],
  };
  const allLessons = catalog.categories.flatMap((category) => category.lessons);
  const firstFreeLesson = allLessons.find((lesson) => lesson.free);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const { data } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
      setCourse(data || { id, title: catalog.title, description: catalog.subtitle, price_inr: 4999 });
      setLoading(false);
    };

    load();
  }, [id]);

  useEffect(() => {
    if (!ready || !session || !id) return;
    supabase.from("purchases").select("course_id").eq("user_id", session.user.id).eq("course_id", id).maybeSingle().then(({ data }) => {
      setPurchased(Boolean(data));
    });
  }, [ready, session, id]);

  useEffect(() => {
    if (!ready && !session) return;
    if (ready && !session) router.replace("/");
  }, [ready, session, router]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const lessonUnlocked = (lesson: any) => Boolean(lesson && (lesson.id === firstFreeLesson?.id || purchased));

  const call = async (claim: boolean, lesson: any) => {
    if (!lesson) return;
    if (!session) return openAuth();
    if (!lessonUnlocked(lesson)) {
      setErr("This lesson is locked. Purchase the course to unlock it.");
      setStream(null);
      return;
    }

    const r = await api("/api/access", session.access_token, { courseId: id, deviceId: deviceId(), claim, lessonId: lesson.id });
    const j = await r.json();
    if (!r.ok) {
      setStream(null);
      setErr(j.error || "Access denied");
      return;
    }
    setErr("");
    if (claim) {
      setStream(j);
      setStreamLesson(lesson);
    }
  };

  useEffect(() => {
    if (!stream || !streamLesson) return;
    const t = setInterval(() => call(false, streamLesson), 45000);
    return () => clearInterval(t);
  }, [stream, streamLesson]);

  const defaultLesson = selectedLesson || firstFreeLesson;
  const defaultLessonUnlocked = Boolean(defaultLesson && lessonUnlocked(defaultLesson));

  const markCompleteAndPlayNext = (lesson: any) => {
    if (!lesson || completedLessons[lesson.id]) return;
    setCompletedLessons((current) => ({ ...current, [lesson.id]: true }));

    const lessonIndex = allLessons.findIndex((item) => item.id === lesson.id);
    const nextLesson = allLessons[lessonIndex + 1];
    if (!nextLesson) return;

    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setAdvancingLesson(nextLesson);
    advanceTimer.current = setTimeout(() => {
      setSelectedLesson(nextLesson);
      setStreamLesson(nextLesson);
      setAdvancingLesson(null);
      setErr("");
      advanceTimer.current = null;
    }, 15000);
  };

  return (
    <main className="course-page">
      <div className="course-page__topbar">
        <Link href="/" className="back-home">← back to courses</Link>
        <Link href="/dashboard" className="dashboard-link">My Dashboard</Link>
      </div>

      <section className="course-shell">
        <div className="course-header">
          <div>
            <span className="eyebrow">Categories</span>
            <h1>{course?.title || catalog.title}</h1>
            <p>{course?.description || catalog.subtitle}</p>
            <div className="course-meta">
              <span>{catalog.categories.length} Chapters</span>
              <span>{catalog.categories.flatMap((c) => c.lessons).length} Lessons</span>
              <span>₹{course?.price_inr ?? 4999}</span>
            </div>
          </div>
        </div>

        <div className="course-layout">
          <aside className="chapter-list">
            {catalog.categories.map((category) => (
              <div key={category.title} className="chapter-block">
                <h3>{category.title}</h3>
                <ul>
                  {category.lessons.map((lesson) => {
                    const unlocked = lessonUnlocked(lesson);
                    return (
                      <li key={lesson.id} className={selectedLesson?.id === lesson.id ? "active" : ""}>
                        <button type="button" onClick={() => {
                          if (advanceTimer.current) clearTimeout(advanceTimer.current);
                          advanceTimer.current = null;
                          setAdvancingLesson(null);
                          setSelectedLesson(lesson);
                          setStream(null);
                          setStreamLesson(null);
                          setErr("");
                        }}>
                          <span className="lesson-title">{lesson.title}</span>
                          <span className="lesson-meta">{lesson.duration} {unlocked ? "" : "• Locked"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </aside>

          <div className="lesson-panel">
            <div className="lesson-panel__header">
              <div>
                <p className="small-label">Selected lesson</p>
                <h2>{defaultLesson?.title || firstFreeLesson?.title}</h2>
              </div>
            </div>

            {err && <div className="lesson-error">{err}</div>}

            {stream ? (
              <div className="player-wrap">
                <Player key={`${stream.src}-${streamLesson?.id}`} {...stream} />
                {streamLesson && (
                  <div className="lesson-completion-actions">
                    {purchased ? (
                      completedLessons[streamLesson.id] ? (
                        <>
                          <span className="completion-status" role="status">
                            <Check size={17} strokeWidth={3} aria-hidden="true" />
                            Completed
                          </span>
                          {advancingLesson && (
                            <span className="next-lesson-status" role="status" aria-live="polite">
                              <span className="loading-spinner" aria-hidden="true" />
                              Loading {advancingLesson.title}...
                            </span>
                          )}
                        </>
                      ) : (
                        <button
                          className="yellow"
                          onClick={() => markCompleteAndPlayNext(streamLesson)}
                        >
                          Mark as Complete
                        </button>
                      )
                    ) : (
                      <button className="yellow" onClick={() => router.push("/#courses")}>
                        Purchase the Course
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="preview-box">
                <h3>{defaultLesson?.title || "Choose a lesson"}</h3>
                <p>{defaultLessonUnlocked ? "Watch the lesson recording." : "Purchase the course to unlock this tutorial."}</p>
                <button
                  className="yellow"
                  disabled={loading || !defaultLesson}
                  onClick={() => {
                    if (!defaultLesson) return;
                    if (!defaultLessonUnlocked) {
                      router.push("/#courses");
                      return;
                    }
                    if (!session) return openAuth();
                    call(true, defaultLesson);
                  }}
                >
                  {defaultLessonUnlocked ? "View Recording" : "Purchase the Course"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
