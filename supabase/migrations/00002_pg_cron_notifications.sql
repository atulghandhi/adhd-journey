-- Milestone 08 - pg_cron + pg_net scheduled jobs

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.invoke_focuslab_edge_function(function_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  service_role_key text := current_setting('app.settings.service_role_key', true);
  supabase_url text := current_setting('app.settings.supabase_url', true);
BEGIN
  IF COALESCE(service_role_key, '') = '' OR COALESCE(supabase_url, '') = '' THEN
    RAISE NOTICE 'Skipping % because app.settings.* is not configured yet.', function_name;
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
END;
$$;

DO $$
DECLARE
  notifications_job_id bigint;
  reviews_job_id bigint;
BEGIN
  SELECT jobid
  INTO notifications_job_id
  FROM cron.job
  WHERE jobname = 'focuslab-daily-notifications';

  IF notifications_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(notifications_job_id);
  END IF;

  SELECT jobid
  INTO reviews_job_id
  FROM cron.job
  WHERE jobname = 'focuslab-daily-reviews';

  IF reviews_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(reviews_job_id);
  END IF;
END;
$$;

SELECT cron.schedule(
  'focuslab-daily-notifications',
  '0 * * * *',
  $$SELECT public.invoke_focuslab_edge_function('daily-notifications');$$
);

SELECT cron.schedule(
  'focuslab-daily-reviews',
  '0 3 * * *',
  $$SELECT public.invoke_focuslab_edge_function('daily-reviews');$$
);
