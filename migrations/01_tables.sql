-- I'm gonna try a new thing where I use singular names for table names.
-- this seems to be more of a standard than plural.

CREATE TABLE directory (
  path TEXT NOT NULL,
  -- entered TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  entered TIMESTAMP DEFAULT (strftime('%s', 'now')) NOT NULL
);
