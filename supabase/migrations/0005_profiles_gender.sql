-- Adds a self-reported gender field to profiles, used by AI prompt
-- builders to select pronouns/relational terms (e.g. brother/sister,
-- his/her). Optional and nullable — 'none' covers users who prefer not
-- to specify or don't identify with either option.

alter table profiles
  add column gender text check (gender in ('male', 'female', 'none'));
