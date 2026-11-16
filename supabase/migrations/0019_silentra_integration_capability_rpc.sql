-- Use high-entropy capability tokens for integration-only RPCs.
-- This keeps the service-role key out of the MoneyFlow web application.
grant execute on function public.claim_silentra_pairing(text)
  to anon, authenticated;
grant execute on function public.record_silentra_platform_payment(
  text, text, numeric, text, timestamptz, text, text
) to anon, authenticated;
grant execute on function public.disconnect_silentra_integration(text)
  to anon, authenticated;

create or replace function public.disconnect_own_silentra_integration()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_rows integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  update public.moneyflow_integrations
  set status = 'disconnected',
      token_hash = encode(extensions.gen_random_bytes(32), 'hex'),
      updated_at = now()
  where user_id = v_user_id
    and provider = 'silentra-for-barbers'
    and status = 'connected';

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

revoke all on function public.disconnect_own_silentra_integration()
  from public, anon, authenticated;
grant execute on function public.disconnect_own_silentra_integration()
  to authenticated;

notify pgrst, 'reload schema';
