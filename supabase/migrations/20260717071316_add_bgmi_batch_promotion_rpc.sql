create or replace function public.promote_bgmi_import_batch(target_batch_id uuid)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp
as $function$
declare
  batch_row public.import_batches%rowtype; tournament_row record; match_row record;
  core_tournament_id uuid; core_match_id uuid; core_external_id text; tournament_slug text;
  promoted_matches integer := 0; promoted_team_results integer := 0; promoted_player_stats integer := 0; affected integer := 0;
begin
  if target_batch_id is null then return jsonb_build_object('ok',false,'reason','missing_batch_id'); end if;
  if not pg_try_advisory_xact_lock(hashtext('bgmi_batch_promotion'),hashtext(target_batch_id::text)) then
    return jsonb_build_object('ok',false,'reason','promotion_already_running','batch_id',target_batch_id);
  end if;
  select * into batch_row from public.import_batches where id=target_batch_id for update;
  if batch_row.id is null then return jsonb_build_object('ok',false,'reason','batch_not_found','batch_id',target_batch_id); end if;
  if batch_row.import_type <> 'bgmi_tournament_results' then return jsonb_build_object('ok',false,'reason','unsupported_import_type','batch_id',target_batch_id); end if;
  if batch_row.status='imported' then
    return jsonb_build_object('ok',true,'promoted',false,'already_promoted',true,'batch_id',target_batch_id,
      'matches',(select count(distinct imported_match_id) from public.bgmi_import_rows where import_batch_id=target_batch_id and imported_match_id is not null),
      'team_results',(select count(*) from public.bgmi_import_rows where import_batch_id=target_batch_id and record_type='team_result' and status='imported'),
      'player_stats',(select count(*) from public.bgmi_import_rows where import_batch_id=target_batch_id and record_type='player_stat' and status='imported'));
  end if;
  if batch_row.status <> 'validated' then return jsonb_build_object('ok',false,'reason','batch_not_validated','status',batch_row.status,'batch_id',target_batch_id); end if;
  if not exists(select 1 from public.bgmi_import_rows where import_batch_id=target_batch_id) then return jsonb_build_object('ok',false,'reason','batch_has_no_rows','batch_id',target_batch_id); end if;
  if exists(select 1 from public.bgmi_import_rows where import_batch_id=target_batch_id and (status<>'matched' or team_id is null or external_match_id is null or btrim(external_match_id)='')) then
    return jsonb_build_object('ok',false,'reason','batch_contains_unresolved_rows','batch_id',target_batch_id);
  end if;
  if exists(select 1 from public.bgmi_import_rows where import_batch_id=target_batch_id and record_type='team_result' and placement is null) then
    return jsonb_build_object('ok',false,'reason','team_result_missing_placement','batch_id',target_batch_id);
  end if;
  if exists(select external_match_id,team_id from public.bgmi_import_rows where import_batch_id=target_batch_id and record_type='team_result' group by external_match_id,team_id having count(*)>1) then
    return jsonb_build_object('ok',false,'reason','duplicate_team_result','batch_id',target_batch_id);
  end if;
  if exists(select external_match_id from public.bgmi_import_rows where import_batch_id=target_batch_id and record_type='team_result' group by external_match_id having count(*)<2) then
    return jsonb_build_object('ok',false,'reason','match_has_fewer_than_two_teams','batch_id',target_batch_id);
  end if;
  update public.import_batches set status='processing' where id=target_batch_id;
  for tournament_row in
    select tournament_name,min(match_date)::date start_date,max(match_date)::date end_date from public.bgmi_import_rows where import_batch_id=target_batch_id group by tournament_name
  loop
    if tournament_row.tournament_name is null or btrim(tournament_row.tournament_name)='' then raise exception 'Tournament name is required for batch %',target_batch_id; end if;
    tournament_slug:=trim(both '-' from regexp_replace(lower(tournament_row.tournament_name),'[^a-z0-9]+','-','g'));
    insert into public.tournaments(name,slug,start_date,end_date,status,game,source,source_url,verified)
    values(tournament_row.tournament_name,tournament_slug,tournament_row.start_date,tournament_row.end_date,
      case when tournament_row.end_date<current_date then 'completed' else 'upcoming' end,'BGMI','liquipedia',batch_row.source_url,false)
    on conflict(slug) do update set name=excluded.name,start_date=coalesce(public.tournaments.start_date,excluded.start_date),
      end_date=coalesce(public.tournaments.end_date,excluded.end_date),game=coalesce(public.tournaments.game,excluded.game),
      source=coalesce(public.tournaments.source,excluded.source),source_url=coalesce(public.tournaments.source_url,excluded.source_url)
    returning id into core_tournament_id;
    update public.bgmi_import_rows set tournament_id=core_tournament_id,updated_at=now()
    where import_batch_id=target_batch_id and tournament_name=tournament_row.tournament_name;
  end loop;
  for match_row in
    select external_match_id,min(tournament_id::text)::uuid tournament_id,min(match_number) match_number,min(match_date) match_date,
      min(nullif(stage,'')) stage,min(nullif(map_name,'')) map_name,
      (min(team_id::text) filter(where record_type='team_result' and placement=1))::uuid winner_team_id
    from public.bgmi_import_rows where import_batch_id=target_batch_id group by external_match_id
  loop
    core_external_id:='bgmi-file-'||match_row.external_match_id;
    insert into public.matches(tournament_id,winner_team_id,map_name,stage,date,external_id,match_number,source,source_url,verified,created_at)
    values(match_row.tournament_id,match_row.winner_team_id,match_row.map_name,match_row.stage,match_row.match_date at time zone 'UTC',
      core_external_id,match_row.match_number,'liquipedia_import',batch_row.source_url,false,now())
    on conflict(external_id) do update set tournament_id=excluded.tournament_id,winner_team_id=excluded.winner_team_id,map_name=excluded.map_name,
      stage=excluded.stage,date=excluded.date,match_number=excluded.match_number,source=excluded.source,source_url=excluded.source_url
    returning id into core_match_id;
    insert into public.team_match_results(match_id,team_id,placement,kills,placement_points,kill_points,total_points,survival_time,created_at)
    select core_match_id,team_id,placement,coalesce(kills,0),coalesce(placement_points,0),coalesce(kill_points,kills,0),
      coalesce(total_points,coalesce(placement_points,0)+coalesce(kill_points,kills,0)),coalesce(survival_time,0),now()
    from public.bgmi_import_rows where import_batch_id=target_batch_id and external_match_id=match_row.external_match_id and record_type='team_result'
    on conflict(match_id,team_id) do update set placement=excluded.placement,kills=excluded.kills,placement_points=excluded.placement_points,
      kill_points=excluded.kill_points,total_points=excluded.total_points,survival_time=excluded.survival_time;
    get diagnostics affected=row_count; promoted_team_results:=promoted_team_results+affected;
    insert into public.player_match_stats(match_id,player_id,team_id,kills,damage,placement,survival_time,assists,revives,knocks,mvp,is_mvp)
    select core_match_id,player_id,team_id,coalesce(kills,0),coalesce(damage,0),coalesce(placement,0),coalesce(survival_time,0),
      coalesce(assists,0),coalesce(revives,0),coalesce(knocks,0),false,false
    from public.bgmi_import_rows where import_batch_id=target_batch_id and external_match_id=match_row.external_match_id and record_type='player_stat' and player_id is not null
    on conflict(match_id,player_id) do update set team_id=excluded.team_id,kills=excluded.kills,damage=excluded.damage,placement=excluded.placement,
      survival_time=excluded.survival_time,assists=excluded.assists,revives=excluded.revives,knocks=excluded.knocks;
    get diagnostics affected=row_count; promoted_player_stats:=promoted_player_stats+affected;
    update public.bgmi_import_rows set status='imported',imported_match_id=core_match_id,updated_at=now()
    where import_batch_id=target_batch_id and external_match_id=match_row.external_match_id;
    promoted_matches:=promoted_matches+1;
  end loop;
  update public.raw_esports_imports set processed=true,processed_at=now() where import_batch_id=target_batch_id;
  update public.import_batches set status='imported',processed_records=total_records,failed_records=0,completed_at=now() where id=target_batch_id;
  perform public.refresh_playrank_summary_stats(); perform public.refresh_playrank_rankings();
  return jsonb_build_object('ok',true,'promoted',true,'already_promoted',false,'batch_id',target_batch_id,
    'matches',promoted_matches,'team_results',promoted_team_results,'player_stats',promoted_player_stats);
end;
$function$;
revoke all on function public.promote_bgmi_import_batch(uuid) from public,anon,authenticated;
grant execute on function public.promote_bgmi_import_batch(uuid) to service_role;;
