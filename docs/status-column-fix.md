# Fixing the Missing Status Column

This guide provides instructions for fixing the missing `status` column in the watch_parties table.

## Issue Description

The application code references a `status` column in the watch_parties table that does not exist in the database. This causes 400 Bad Request errors when the application tries to access or update this column.

## Current Fix Status

✅ Temporary fixes have been applied:
- Modified the code to use `is_active` as a fallback
- Updated the TypeScript interface to include both properties
- Fixed all UI components to handle missing status column

⚠️ Still needed: Adding the actual column to the database

## Solution Options

You have two options:

### Option 1: Add the Missing Column (Recommended)

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Paste and run the following SQL:

```sql
-- Add the missing status column to the watch_parties table
ALTER TABLE public.watch_parties
ADD COLUMN status TEXT NOT NULL DEFAULT 'waiting'
CHECK (status IN ('waiting', 'active', 'ended'));

-- Update existing records to have a default status
UPDATE public.watch_parties
SET status = 'waiting'
WHERE status IS NULL;
```

4. Verify the column was added successfully by querying the table:

```sql
SELECT id, title, status FROM public.watch_parties LIMIT 10;
```

### Option 2: Temporary Compatibility Layer

If you cannot immediately add the column to the database, you can run a script that modifies the code to use `is_active` as a fallback:

```bash
node fix-missing-status.js
```

This script:
1. Updates the `updatePartyStatus` function to use `is_active` instead of `status`
2. Adds a compatibility layer to map `is_active` to a virtual `status` property
3. Updates references to `party.status` to fall back to a derived value from `is_active`

**Note**: This is only a temporary solution and you should still add the column to the database when possible.

## Verification

After applying either fix, test the watch party functionality:
1. Create a new watch party
2. Join the party as another user
3. Change the party status (start/pause/end)
4. Verify no 400 Bad Request errors appear in the console

## Need Help?

If you encounter any issues applying these fixes, please contact the development team.
