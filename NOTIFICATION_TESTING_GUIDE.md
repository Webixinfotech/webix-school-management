# Notification API Testing Guide

## Overview
Test FCM (Firebase Cloud Messaging) push notifications using the new `/api/notifications/test-send` endpoint.

## Prerequisites

1. **FCM Token** from your mobile app:
   - Android: Token from FirebaseMessaging.getInstance().getToken()
   - iOS: Token from Messaging.messaging().fcmToken
   - Web: Token from getToken()

2. **Backend running** on `http://localhost:3000`

3. **Valid JWT token** (login as any user: admin/teacher/parent)

---

## Testing Steps

### Step 1: Login & Get JWT Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@brainbuilder.com",
  "password": "your_password"
}
```
**Response:** Copy the `token` from response body.

---

### Step 2: Register Your Device Token
```http
POST /api/notifications/register-device
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

{
  "token": "YOUR_ACTUAL_FCM_TOKEN_FROM_APP",
  "deviceType": "android",  // or "ios", "web"
  "deviceName": "MyTestPhone"
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "message": "Device token registered successfully",
  "data": {
    "_id": "...",
    "userId": "...",
    "token": "...",
    "deviceType": "android",
    "isActive": true
  }
}
```

---

### Step 3: Verify Device is Registered
```http
GET /api/notifications/my-devices
Authorization: Bearer {{jwtToken}}
```
**Expected:** Array containing your device token.

---

### Step 4: Send Test Notification (to Self)

```http
POST /api/notifications/test-send
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

{
  "title": "🧪 Test Notification",
  "body": "This is a test push from BrainBuilder backend. If you see this, FCM is working!",
  "data": {
    "type": "test",
    "timestamp": "2024-12-15T10:00:00Z"
  },
  "sendToSelf": true
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Test notification sent to 1 device(s)",
  "data": {
    "success": true,
    "successCount": 1,
    "failureCount": 0,
    "responses": [
      {
        "token": "fcm_token_....",
        "success": true,
        "response": "projects/.../messages/..."
      }
    ]
  }
}
```

**✅ SUCCESS:** If you see the notification on your device → **FCM IS WORKING!**

---

### Step 5: Send Test Notification (Direct Token - No Prior Registration)

Use this to test a token without registering it first:

```http
POST /api/notifications/test-send
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

{
  "token": "SOME_OTHER_FCM_TOKEN",
  "title": "Direct Token Test",
  "body": "Testing with explicit FCM token"
}
```

---

## Expected Behaviors

| Scenario | Expected Result |
|----------|-----------------|
| Valid token registered + sendToSelf: true | Notification arrives on device |
| Invalid token (wrong format) | 400 error: "FCM token is too short" |
| No devices registered & no token provided | 400 error: "No device tokens registered" |
| Valid device, FCM configured | successCount=1, notification arrives |
| Invalid FCM token (Firebase rejects) | successCount=0, failureCount=1, error in response |
| No Firebase config (server) | 500 error: "Firebase is not initialized" |

---

## Common Issues & Debugging

### 1. **No notification arrives, but successCount=1**
- Check device has internet
- Verify app has Firebase initialized and token is correct
- On Android: Ensure notification channel is created
- On iOS: Check APNs certificates configured in Firebase

### 2. **Firebase error: `messaging/registration-token-not-registered`**
- Token is stale/app uninstalled
- Get a fresh token from the app and re-register

### 3. **500 Error: "Firebase is not initialized"**
- Backend `.env` missing Firebase credentials:
  ```
  FIREBASE_PROJECT_ID=...
  FIREBASE_PRIVATE_KEY=...
  FIREBASE_CLIENT_EMAIL=...
  ```
- Check `src/config/firebase.js` loads credentials correctly

### 4. **500 Error: "No device tokens found"**
- You didn't register any device yet → do Step 2 first
- Or if using `token` field directly, omit `sendToSelf` and provide token

### 5. **403 Error: Not authorized**
- Ensure you're sending `Authorization: Bearer <valid_jwt>` header
- Token must not be expired

---

## Using Postman Collection

Import `attendance_api_postman_collection.json` and use the **NOTIFICATION - Push Test** folder:

1. **Login** → Run AUTH → Login → copy `token` → set `jwtToken` variable
2. **Register Device** → Run `Register Device Token` → replace `YOUR_FCM_TOKEN_HERE` with real token
3. **Verify** → Run `Get My Registered Devices` → should see your token
4. **Test** → Run `Send Test Notification (Self)` → should receive push on device
5. **Check Logs** (Admin only) → Run `Get Notification Logs` → see entry with status "success"

---

## Quick Curl Commands

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brainbuilder.com","password":"..."}'

# 2. Register device (replace TOKEN and JWT)
curl -X POST http://localhost:3000/api/notifications/register-device \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_FCM_TOKEN","deviceType":"android","deviceName":"Test"}'

# 3. Send test notification
curl -X POST http://localhost:3000/api/notifications/test-send \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello","sendToSelf":true}'

# 4. Get logs (admin only)
curl -X GET "http://localhost:3000/api/notifications/logs?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_JWT"
```

---

## Integration Test Checklist

- [ ] Firebase Admin SDK initialized without errors
- [ ] FCM token successfully registered in DB (`DeviceToken` collection)
- [ ] Test notification sent with `successCount: 1`
- [ ] Device receives push notification (foreground/background)
- [ ] Notification log created in `NotificationLog` collection
- [ ] Device token `lastUsed` timestamp updated
- [ ] Invalid token returns appropriate FCM error
- [ ] Multiple devices (if registered) all receive notification
- [ ] Test with `sendToSelf: false` and explicit `token` works
- [ ] Admin can view logs via `/api/notifications/logs`

---

## Notes

- The `test-send` endpoint is accessible to **all authenticated users** (admin/teacher/parent)
- Admin-only endpoints (`/send-to-user`, `/broadcast`) require admin role
- All notification failures are logged but don't block the main operation
- For production, consider rate-limiting the test endpoint
