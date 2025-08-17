
-- Create a table for public profiles
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  username text unique,
  full_name text,
  updated_at timestamp with time zone default now(),
  primary key (id),
  constraint username_length check (char_length(username) >= 3)
);

-- Add comments to the table and columns
comment on table public.profiles is 'Public profile information for each user.';
comment on column public.profiles.id is 'References the internal Supabase auth user.';
comment on column public.profiles.username is 'Public username for the user.';

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- This trigger automatically creates a profile for new users.
-- It will take the email part before the '@' as a default username.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC function to get email from username
create or replace function public.get_email_by_username(p_username text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  -- Find the user_id from the profiles table based on the username
  select id into v_user_id from public.profiles where username = p_username;

  if v_user_id is null then
    return null; -- Username not found
  end if;

  -- With security definer, we can query auth.users table
  select email into v_email from auth.users where id = v_user_id;

  return v_email;
end;
$$;

-- Function to check if username is available
create or replace function public.is_username_available(p_username text, p_user_id uuid default null)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  -- If user_id is provided, exclude that user from the check (for updates)
  if p_user_id is not null then
    return not exists (
      select 1 from public.profiles 
      where username = p_username and id != p_user_id
    );
  else
    return not exists (
      select 1 from public.profiles 
      where username = p_username
    );
  end if;
end;
$$;

-- Function to handle profile updates
create or replace function public.handle_profile_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for profile updates
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_profile_update();
