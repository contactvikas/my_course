import { admin, getUser } from "@/lib/server";

export async function POST(req: Request) {
  if (process.env.DEMO_MODE !== "true") return Response.json({ error: "Disabled" }, { status: 403 });
  const user = await getUser(req);
  if (!user) return Response.json({ error: "Login required" }, { status: 401 });
  const { courseId } = await req.json();
  await admin().from("purchases").upsert({ user_id: user.id, course_id: courseId });
  return Response.json({ ok: true });
}
