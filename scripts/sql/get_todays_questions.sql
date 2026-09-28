-- get_todays_questions() — replacement RPC that enforces film diversity.
--
-- Behavior:
--   • Idempotent for a given day (returns already-stamped questions unchanged).
--   • Picks the least-recently-used act1 question (unused first, then oldest).
--   • Picks 5 act2 questions with distinct films, none matching act1's film.
--   • Picks act3 and act4 with films that don't match anything picked so far.
--   • Falls back to "any question" if the diverse pool is empty for an act
--     (so a ritual is always returned, even if the DB is thin).
--
-- To install: paste this whole block into the Supabase SQL Editor and run.
-- (Requires a `film text` column on the questions table.)

CREATE OR REPLACE FUNCTION public.get_todays_questions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date date := current_date;
  used_films text[] := ARRAY[]::text[];

  a1_id uuid;
  a1_film text;
  a2_ids uuid[];
  a3_id uuid;
  a3_film text;
  a4_id uuid;
BEGIN
  -- Idempotency: if any question is already stamped for today, return them all.
  IF EXISTS (SELECT 1 FROM questions WHERE used_on = today_date) THEN
    RETURN jsonb_build_object(
      'act1', (SELECT to_jsonb(q.*) FROM questions q WHERE act = 1 AND used_on = today_date LIMIT 1),
      'act2', COALESCE(
        (SELECT jsonb_agg(to_jsonb(q.*)) FROM (
          SELECT * FROM questions WHERE act = 2 AND used_on = today_date LIMIT 5
        ) q),
        '[]'::jsonb
      ),
      'act3', (SELECT to_jsonb(q.*) FROM questions q WHERE act = 3 AND used_on = today_date LIMIT 1),
      'act4', (SELECT to_jsonb(q.*) FROM questions q WHERE act = 4 AND used_on = today_date LIMIT 1)
    );
  END IF;

  -- ── Act 1 ───────────────────────────────────────────────────────────
  SELECT id, film INTO a1_id, a1_film
  FROM questions
  WHERE act = 1
  ORDER BY used_on ASC NULLS FIRST, random()
  LIMIT 1;

  IF a1_id IS NOT NULL THEN
    UPDATE questions SET used_on = today_date WHERE id = a1_id;
    IF a1_film IS NOT NULL THEN
      used_films := array_append(used_films, a1_film);
    END IF;
  END IF;

  -- ── Act 2: 5 questions, distinct films, none matching act1's ────────
  -- Rank questions within each film by LRU, then take one per film until we
  -- have 5 (or exhaust the film pool). Fall back to any 5 act2 rows.
  WITH ranked AS (
    SELECT id, film,
      ROW_NUMBER() OVER (
        PARTITION BY COALESCE(film, id::text)
        ORDER BY used_on ASC NULLS FIRST, random()
      ) AS film_rank
    FROM questions
    WHERE act = 2
      AND (film IS NULL OR NOT (film = ANY(used_films)))
  )
  SELECT array_agg(id ORDER BY random()) INTO a2_ids
  FROM (
    SELECT id, film FROM ranked WHERE film_rank = 1
    ORDER BY random()
    LIMIT 5
  ) t;

  -- Fallback: not enough distinct films → grab any 5 unused act2 rows
  IF a2_ids IS NULL OR array_length(a2_ids, 1) < 5 THEN
    SELECT array_agg(id)
    INTO a2_ids
    FROM (
      SELECT id FROM questions
      WHERE act = 2
      ORDER BY used_on ASC NULLS FIRST, random()
      LIMIT 5
    ) t;
  END IF;

  IF a2_ids IS NOT NULL THEN
    UPDATE questions SET used_on = today_date WHERE id = ANY(a2_ids);
    SELECT array_agg(DISTINCT film) INTO used_films
    FROM questions
    WHERE (id = a1_id OR id = ANY(a2_ids)) AND film IS NOT NULL;
    IF used_films IS NULL THEN used_films := ARRAY[]::text[]; END IF;
  END IF;

  -- ── Act 3 ───────────────────────────────────────────────────────────
  SELECT id, film INTO a3_id, a3_film
  FROM questions
  WHERE act = 3 AND (film IS NULL OR NOT (film = ANY(used_films)))
  ORDER BY used_on ASC NULLS FIRST, random()
  LIMIT 1;

  IF a3_id IS NULL THEN
    -- Fallback: any act3
    SELECT id, film INTO a3_id, a3_film
    FROM questions
    WHERE act = 3
    ORDER BY used_on ASC NULLS FIRST, random()
    LIMIT 1;
  END IF;

  IF a3_id IS NOT NULL THEN
    UPDATE questions SET used_on = today_date WHERE id = a3_id;
    IF a3_film IS NOT NULL THEN
      used_films := array_append(used_films, a3_film);
    END IF;
  END IF;

  -- ── Act 4 ───────────────────────────────────────────────────────────
  SELECT id INTO a4_id
  FROM questions
  WHERE act = 4 AND (film IS NULL OR NOT (film = ANY(used_films)))
  ORDER BY used_on ASC NULLS FIRST, random()
  LIMIT 1;

  IF a4_id IS NULL THEN
    SELECT id INTO a4_id
    FROM questions
    WHERE act = 4
    ORDER BY used_on ASC NULLS FIRST, random()
    LIMIT 1;
  END IF;

  IF a4_id IS NOT NULL THEN
    UPDATE questions SET used_on = today_date WHERE id = a4_id;
  END IF;

  -- ── Return the freshly-stamped set ─────────────────────────────────
  RETURN jsonb_build_object(
    'act1', (SELECT to_jsonb(q.*) FROM questions q WHERE id = a1_id),
    'act2', COALESCE(
      (SELECT jsonb_agg(to_jsonb(q.*)) FROM questions q WHERE id = ANY(a2_ids)),
      '[]'::jsonb
    ),
    'act3', (SELECT to_jsonb(q.*) FROM questions q WHERE id = a3_id),
    'act4', (SELECT to_jsonb(q.*) FROM questions q WHERE id = a4_id)
  );
END;
$$;
