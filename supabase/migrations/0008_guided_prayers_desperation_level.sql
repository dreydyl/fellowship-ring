-- Track which desperation level a guided prayer was generated for.
-- Useful for debugging/analytics on which tier (joyful/peaceful/
-- zealous) was selected; not required for rendering the prayer itself.

alter table guided_prayers
  add column desperation_level int check (desperation_level between 1 and 10);
