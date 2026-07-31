-- Persist the desperation level assessed for a confession entry (see
-- assess-desperation / generate-entry-guidance). A value of 0 means the
-- entry was determined to have nothing to do with confession/recovery
-- at all, so formatEntryHistory excludes entries with this value from
-- the history block fed into later prompts. Null until
-- generate-entry-guidance's assess-desperation step resolves for this
-- entry.
alter table confession_entries
  add column desperation_level int check (desperation_level between 0 and 10);
