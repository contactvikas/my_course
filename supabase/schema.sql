create table courses (
  id text primary key,
  title text not null,
  description text,
  price_inr int not null default 0,
  video_path text not null   -- e.g. courses/demo/index.m3u8 (path inside S3/CloudFront)
);
create table purchases (
  user_id uuid references auth.users on delete cascade,
  course_id text references courses(id),
  created_at timestamptz default now(),
  primary key (user_id, course_id)
);
create table devices (
  user_id uuid primary key references auth.users on delete cascade,
  device_id text not null,
  updated_at timestamptz default now()
);
alter table courses enable row level security;
alter table purchases enable row level security;
alter table devices enable row level security;
create policy "courses readable" on courses for select to authenticated using (true);
create policy "own purchases" on purchases for select to authenticated using (auth.uid() = user_id);
-- writes happen only from server routes using the service role key

insert into courses values ('demo', 'Demo course', 'Sample lesson to test login, purchase and protected playback.', 499, 'courses/demo/index.m3u8');
