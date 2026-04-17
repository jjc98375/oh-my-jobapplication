-- Add extension_token column for secure API auth (replaces user ID as token)
ALTER TABLE users ADD COLUMN extension_token TEXT UNIQUE;

-- Atomic daily limit increment function (prevents race condition)
CREATE OR REPLACE FUNCTION try_increment_apps_today(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, apps_today_new INTEGER, daily_limit_out INTEGER) AS $$
DECLARE
  v_apps_today INTEGER;
  v_daily_limit INTEGER;
BEGIN
  UPDATE users
  SET apps_today = users.apps_today + 1
  WHERE id = p_user_id AND users.apps_today < users.daily_limit
  RETURNING users.apps_today, users.daily_limit INTO v_apps_today, v_daily_limit;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, v_apps_today, v_daily_limit;
  ELSE
    SELECT u.apps_today, u.daily_limit INTO v_apps_today, v_daily_limit
    FROM users u WHERE u.id = p_user_id;
    RETURN QUERY SELECT FALSE, v_apps_today, v_daily_limit;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Daily counter reset (requires pg_cron — enabled by default in Supabase)
-- Resets apps_today to 0 at midnight UTC
SELECT cron.schedule(
  'reset-daily-counts',
  '0 0 * * *',
  $$UPDATE users SET apps_today = 0$$
);
