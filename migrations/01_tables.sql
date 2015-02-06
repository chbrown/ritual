-- I'm gonna try a new thing where I use singular names for table names.
-- this seems to be more of a standard than plural names.

CREATE TABLE directory (
  path TEXT NOT NULL,
  entered INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
);
