# Course site (demo)

## Run locally
1. Supabase: create project, run `supabase/schema.sql` in SQL editor. (Auth > Providers > Email: turn off "Confirm email" for faster testing.)
2. `cp .env.example .env.local` and fill the three Supabase values. Leave CloudFront empty.
3. `npm install && npm run dev` -> http://localhost:3000
   Sign up, click "Get for free", click Watch. A public test stream plays with your email as moving watermark.

## Switch to your own videos (S3 + CloudFront)
1. Make HLS locally for testing:
   ffmpeg -i lesson.mp4 -c:v libx264 -c:a aac -vf scale=-2:720 -b:v 2500k -hls_time 6 -hls_playlist_type vod -hls_segment_filename "seg_%04d.ts" index.m3u8
   (Later, automate with AWS MediaConvert.)
2. Upload to private S3 bucket under `courses/demo/` (index.m3u8 + seg_*.ts).
3. CloudFront: S3 origin with Origin Access Control, bucket policy for OAC,
   behavior "Restrict viewer access" = yes with a Trusted key group,
   response headers policy = managed "SimpleCORS" (hls.js needs CORS).
4. Fill CLOUDFRONT_DOMAIN, CLOUDFRONT_KEY_PAIR_ID, CLOUDFRONT_PRIVATE_KEY. Restart.

## Before production
- DEMO_MODE=false, add Razorpay order + webhook that inserts into `purchases`.
- Custom domain + HTTPS, rate limiting on /api/access.

## Docker
    docker compose --env-file .env.local up -d --build
    docker compose logs -f web
Open http://localhost:3000 via VS Code port forwarding.
After changing NEXT_PUBLIC_* values, rebuild with the same command.
