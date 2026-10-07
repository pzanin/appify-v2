-- Additive: does not modify buyer authentication or existing Supabase tables.
begin;
create table public.appify_analytics_projects (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  allowed_origin text not null check (allowed_origin ~ '^https://[a-zA-Z0-9.-]+(:[0-9]+)?$'),
  enabled boolean not null default false
);
create table public.appify_analytics_events (
  event_id uuid primary key,
  project_id uuid not null references public.appify_analytics_projects(id) on delete cascade,
  installation_id uuid not null,
  event_name text not null check (event_name in ('lesson_open','lesson_complete','link_click')),
  module_id text not null check (module_id ~ '^[0-9]{1,20}$'),
  lesson_id text not null check (lesson_id = '' or lesson_id ~ '^[0-9]{1,20}$'),
  target_kind text not null check (target_kind in ('','offer','material')),
  target_id text not null check (target_id = '' or target_id ~ '^[a-zA-Z0-9._:-]{1,80}$'),
  received_at timestamptz not null default now()
);
create index appify_analytics_period on public.appify_analytics_events(project_id, received_at);
create index appify_analytics_device_period on public.appify_analytics_events(project_id, installation_id, received_at);
create unique index appify_analytics_one_completion on public.appify_analytics_events(project_id,installation_id,module_id,lesson_id) where event_name = 'lesson_complete';
alter table public.appify_analytics_projects enable row level security;
alter table public.appify_analytics_events enable row level security;
revoke all on public.appify_analytics_projects, public.appify_analytics_events from anon, authenticated;
grant select,insert,update on public.appify_analytics_projects to authenticated;
grant select on public.appify_analytics_events to authenticated;
grant all on public.appify_analytics_projects, public.appify_analytics_events to service_role;
create policy appify_analytics_owner_projects on public.appify_analytics_projects for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy appify_analytics_owner_events on public.appify_analytics_events for select to authenticated using (exists (select 1 from public.appify_analytics_projects p where p.id = project_id and p.owner_id = (select auth.uid())));

-- Read-only report respects the owner's RLS policies. No anonymous reports.
create function public.appify_analytics_report(p_project_id uuid, p_since timestamptz, p_until timestamptz)
returns table(event_name text,module_id text,lesson_id text,target_kind text,target_id text,total bigint)
language sql stable security invoker set search_path = '' as $$
  select e.event_name,e.module_id,e.lesson_id,e.target_kind,e.target_id,count(*)
  from public.appify_analytics_events e
  where e.project_id = p_project_id and e.received_at >= greatest(p_since,p_until - interval '90 days') and e.received_at < p_until
  group by e.event_name,e.module_id,e.lesson_id,e.target_kind,e.target_id
  order by e.module_id,e.lesson_id,e.event_name,e.target_id;
$$;
revoke all on function public.appify_analytics_report(uuid,timestamptz,timestamptz) from public,anon;
grant execute on function public.appify_analytics_report(uuid,timestamptz,timestamptz) to authenticated;

-- Only the server-side Edge Function may ingest. No public insert/RPC grant.
create function public.appify_analytics_ingest(p_event jsonb, p_origin text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_project uuid := (p_event->>'projectId')::uuid;
  v_installation uuid := (p_event->>'installationId')::uuid;
  v_project_row public.appify_analytics_projects;
begin
  select * into v_project_row from public.appify_analytics_projects where id=v_project for update;
  if not found or not v_project_row.enabled or v_project_row.allowed_origin <> p_origin then return false; end if;
  -- Serialized per project: limits hold across concurrent Edge Function instances.
  if (select count(*) from public.appify_analytics_events where project_id=v_project and received_at >= now()-interval '1 minute') >= 1000
    or (select count(*) from public.appify_analytics_events where project_id=v_project and received_at >= (date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')) >= 10000
    or (select count(*) from public.appify_analytics_events where project_id=v_project and installation_id=v_installation and received_at >= now()-interval '1 minute') >= 30 then return false; end if;
  insert into public.appify_analytics_events(event_id,project_id,installation_id,event_name,module_id,lesson_id,target_kind,target_id)
  values ((p_event->>'eventId')::uuid,v_project,v_installation,p_event->>'eventName',p_event->>'moduleId',p_event->>'lessonId',p_event->>'targetKind',p_event->>'targetId')
  on conflict do nothing;
  return true;
end;
$$;
revoke all on function public.appify_analytics_ingest(jsonb,text) from public,anon,authenticated;
grant execute on function public.appify_analytics_ingest(jsonb,text) to service_role;
commit;
