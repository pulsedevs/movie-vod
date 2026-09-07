# Party Participants RLS Fix

This document explains how to fix the 400 Bad Request errors when accessing the `party_participants` table.

## Issue Description

The application is receiving 400 Bad Request errors when trying to query the `party_participants` table with the current Row Level Security (RLS) policies. This happens when checking if a user is already a participant in a party.

The error looks like this:
```
GET https://eulbkkpnpzbydikovmcv.supabase.co/rest/v1/party_participants?select=id%2Cis_active&party_id=eq.[PARTY_ID]&user_id=eq.[USER_ID]
Status Code: 400 Bad Request
```

## Cause

The current RLS policies for the `party_participants` table are too restrictive or causing recursive queries. The policies might be trying to check if a user is in a party before allowing them to see if they're in a party, creating a circular dependency.

## Solution

We've created updated RLS policies that are more permissive while still maintaining security:

1. Allow all authenticated users to SELECT from party_participants (simpler approach)
2. Keep INSERT, UPDATE, and DELETE restricted to appropriate users
3. Similar fixes for the party_messages table

## How to Apply the Fix

### Option 1: Run the script (requires service role key)

If you have access to the Supabase service role key, run:

```bash
# Set environment variable for service role key
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the script
node apply-party-participants-fix.js
```

### Option 2: Manual SQL execution

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the SQL from `fix-party-participants-rls.sql`
4. Run the SQL script

## Verification

After applying the fix, test the application to ensure:

1. Users can view watch parties
2. Users can join watch parties
3. Users can view participants in a party
4. Users can send and view messages in a party

If any issues persist, check the browser console for specific error messages.

## Need Help?

If you continue to experience issues, you may need to:

1. Check for additional restrictive RLS policies
2. Verify that your Supabase client is properly authenticated
3. Make sure your useWatchParty hook has proper error handling
