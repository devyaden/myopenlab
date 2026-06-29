-- Self-service account deletion. Every user/canvas FK is ON DELETE RESTRICT (not
-- cascade), so a user's data must be removed in dependency order before the profile
-- row — exactly like delete_folder_with_contents, but for ALL of a user's data.
-- security definer so it runs past RLS; callable ONLY by service_role (the gated
-- /api/account/delete route), never by anon/authenticated directly. Idempotent:
-- re-running for an already-deleted user is a no-op.

create or replace function public.delete_user_account(target_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  cvs uuid;
begin
  -- 1. References the user owns (also FK-cascade from canvas, but explicit + owner-scoped).
  delete from public.reference where user_id = target_user_id;

  -- 2. Per-canvas dependents (all ON DELETE RESTRICT), for every canvas the user owns.
  for cvs in select id from public.canvas where user_id = target_user_id loop
    delete from public.column_definition where related_canvas_id = cvs;
    delete from public.column_definition where canvas_id = cvs;
    delete from public.canvas_share      where canvas_id = cvs;
    delete from public.canvas_history    where canvas_id = cvs;
    delete from public.canvas_settings   where canvas_id = cvs;
    delete from public.canvas_data       where canvas_id = cvs;
    delete from public.document_data     where canvas_id = cvs;
  end loop;

  -- 3. Shares where the user is the sharee (canvas_share.user_id RESTRICT FK).
  delete from public.canvas_share where user_id = target_user_id;

  -- 4. The user's canvases + folders.
  delete from public.canvas where user_id = target_user_id;
  delete from public.folder where user_id = target_user_id;

  -- 5. Billing + usage.
  delete from public.user_subscription where user_id = target_user_id;
  delete from public.ai_usage          where user_id = target_user_id;
  delete from public.ai_token_usage    where user_id = target_user_id;

  -- 6. Agent + exploration (messages/attachments/proposals cascade from the conversation).
  delete from public.agent_conversation   where user_id = target_user_id;
  delete from public.explore_conversation where user_id = target_user_id;

  -- 7. Workspace settings.
  delete from public.workspace where user_id = target_user_id;

  -- 8. Finally the profile row. (If an FK public.user → auth.users exists, deleting
  --    the profile here unblocks the auth.users deletion the route performs next; if
  --    no such FK exists, this is the explicit cleanup so no orphan profile remains.)
  delete from public."user" where id = target_user_id;
end;
$$;

-- Lock it down: only the service role (the gated route) may execute it.
revoke all on function public.delete_user_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_user_account(uuid) to service_role;
