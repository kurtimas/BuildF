create table if not exists yard_floor (
  id integer primary key check (id = 1),
  layout jsonb not null,
  password_hash text,
  updated_at timestamptz not null default now()
);
