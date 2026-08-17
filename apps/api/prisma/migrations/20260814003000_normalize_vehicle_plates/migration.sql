-- Preserve canonical identity as (parkingId, normalized plate). Do not merge
-- collisions automatically: the owner must resolve them before preservation.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Vehicle"
    GROUP BY "parkingId", REGEXP_REPLACE(UPPER(BTRIM("plate")), '[^A-Z0-9]', '', 'g')
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Vehicle plate normalization would collide within a parking. Export and resolve duplicate vehicles before applying this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Vehicle"
    WHERE REGEXP_REPLACE(UPPER(BTRIM("plate")), '[^A-Z0-9]', '', 'g') = ''
  ) THEN
    RAISE EXCEPTION
      'Vehicle plate normalization produced an empty plate. Export and resolve invalid vehicles before applying this migration.';
  END IF;
END $$;

UPDATE "Vehicle"
SET "plate" = REGEXP_REPLACE(UPPER(BTRIM("plate")), '[^A-Z0-9]', '', 'g');
