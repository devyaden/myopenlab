-- Update existing handle_new_user function with null-safe handling
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public."user" (
    id,
    name,
    email,
    avatar_url,
    company_email,
    company_name,
    company_sector,
    company_size,
    user_position,
    username
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'name', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'company_email', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_sector', ''),
    nullif(new.raw_user_meta_data ->> 'company_size', ''),
    nullif(new.raw_user_meta_data ->> 'user_position', ''),
    nullif(new.raw_user_meta_data ->> 'username', '')
  );
  return new;
end;
$$;
