# Firebase Console Setup Guide

## 1. Choose Client vs Server Configuration

**For your Next.js movie app, choose "Client"** because:
- Your app runs in users' browsers
- Remote Config values are fetched client-side
- You're using `NEXT_PUBLIC_` environment variables

## 2. Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **boredflix-955b0**
3. In the left sidebar, click **"Remote Config"**

## 3. Create Required Parameters

You need to create these 4 parameters:

### Parameter 1: `movieSourceOverrides`
- **Parameter key**: `movieSourceOverrides`
- **Data type**: `JSON`
- **Default value**:
```json
{
  "574475": 3
}
```
- **Description**: Movie-specific source overrides (movie ID → source index)

### Parameter 2: `tvSourceOverrides`
- **Parameter key**: `tvSourceOverrides`
- **Data type**: `JSON`
- **Default value**:
```json
{}
```
- **Description**: TV show-specific source overrides (TV ID → source index)

### Parameter 3: `emergencySourceDisable`
- **Parameter key**: `emergencySourceDisable`
- **Data type**: `JSON`
- **Default value**:
```json
[]
```
- **Description**: Array of source indices to disable in emergencies

### Parameter 4: `sourceHealthCheckEnabled`
- **Parameter key**: `sourceHealthCheckEnabled`
- **Data type**: `Boolean`
- **Default value**: `false`
- **Description**: Enable/disable source health monitoring

## 4. Step-by-Step Parameter Creation

For each parameter:

1. Click **"Add parameter"**
2. Enter the **Parameter key** (exact name from above)
3. Set the **Data type** (JSON or Boolean)
4. Enter the **Default value**
5. Add the **Description**
6. Click **"Save"**

## 5. Publish Your Configuration

After creating all 4 parameters:

1. Click **"Publish changes"** button
2. Add a version description like: "Initial Remote Config setup"
3. Click **"Publish"**

## 6. Verify Setup

Your Firebase Console should show:
- ✅ 4 parameters created
- ✅ Configuration published
- ✅ Version history showing your publish

## 7. Test in Your App

After publishing, your app should be able to:
- Fetch remote config values
- Use the parameters for source management
- Fall back to defaults if fetch fails

## Troubleshooting

If you see "Failed to fetch and activate remote config":

1. **Check Parameter Names**: Must match exactly (case-sensitive)
2. **Verify JSON Format**: Use proper JSON syntax for JSON parameters
3. **Confirm Publication**: Changes must be published, not just saved
4. **Wait for Propagation**: Can take 1-2 minutes for changes to propagate

## Common Issues

### Issue: "Client or Server" Choice
- **Solution**: Choose "Client" for web apps

### Issue: JSON Validation Errors
- **Solution**: Use proper JSON format (no trailing commas, proper quotes)

### Issue: Parameters Not Found
- **Solution**: Ensure exact parameter key names and publish changes

## Example Values for Testing

Once setup is complete, you can test with these values:

```json
// movieSourceOverrides - Force specific movies to use different sources
{
  "574475": 3,
  "299536": 2,
  "453395": 1
}

// tvSourceOverrides - Force specific TV shows to use different sources
{
  "1399": 2,
  "94605": 1
}

// emergencySourceDisable - Disable problematic sources
[1, 3]

// sourceHealthCheckEnabled - Enable monitoring
true
```
