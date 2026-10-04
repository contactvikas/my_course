import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { admin, getUser } from "@/lib/server";

// POST { courseId, deviceId, claim }  -> { src, query, label }
// claim=true  : this device becomes the only active device (on Play)
// claim=false : heartbeat; 409 if another device has taken over
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return Response.json({ error: "Login required" }, { status: 401 });
  const { courseId, deviceId, claim, lessonId } = await req.json();
  const db = admin();

  const { data: bought } = await db.from("purchases").select("course_id")
    .eq("user_id", user.id).eq("course_id", courseId).maybeSingle();

  const freeLesson = courseId === "demo"
    ? lessonId === "demo-lesson-1"
    : lessonId === "lesson-1";
  const isUnlocked = Boolean(bought) || freeLesson;
  if (!isUnlocked) return Response.json({ error: "Not purchased" }, { status: 403 });

  const { data: dev } = await db.from("devices").select("device_id").eq("user_id", user.id).maybeSingle();
  if (claim || !dev) {
    await db.from("devices").upsert({ user_id: user.id, device_id: deviceId, updated_at: new Date().toISOString() });
  } else if (dev.device_id !== deviceId) {
    return Response.json({ error: "Logged in on another device" }, { status: 409 });
  }

  const { data: course } = await db.from("courses").select("video_path").eq("id", courseId).single();
  const label = user.email || user.phone || user.id;
  const { CLOUDFRONT_DOMAIN: domain, CLOUDFRONT_KEY_PAIR_ID: keyPairId, CLOUDFRONT_PRIVATE_KEY: pk } = process.env;

  if (!domain || !keyPairId || !pk) {
    return Response.json({ src: process.env.DEMO_STREAM_URL, query: "", label });
  }

  const folder = course.video_path.split("/").slice(0, -1).join("/");
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 3;
  const policy = JSON.stringify({
    Statement: [{ Resource: `https://${domain}/${folder}/*`, Condition: { DateLessThan: { "AWS:EpochTime": expires } } }],
  });
  const signed = getSignedUrl({
    url: `https://${domain}/${course.video_path}`,
    keyPairId, privateKey: pk.replace(/\\n/g, "\n"), policy,
  });
  const u = new URL(signed);
  return Response.json({ src: `https://${domain}/${course.video_path}`, query: u.search.slice(1), label });
}
