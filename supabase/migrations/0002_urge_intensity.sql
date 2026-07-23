-- Adds urge intensity tracking to confession entries.

alter table confession_entries
  add column urge_intensity int not null default 1
    check (urge_intensity between 1 and 5);
