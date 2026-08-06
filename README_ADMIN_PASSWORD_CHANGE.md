# Admin Password Change Feature

## Overview
This guide explains how to use the newly implemented admin password change functionality in the BrainBuilder Backend system.

## What Was Added
Admins can now change any user's password without needing the current password. This is useful for:
- Password recovery when users forget their credentials
- Security resets when accounts are compromised
- Initial password setup for new users

## API Endpoint
```
PUT /api/auth/admin/change-password/:userId
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <admin_jwt_token>
```

### URL Parameters
- `userId`: The ID of the user whose password you want to change

### Request Body
```json
{
  "newPassword": "your_new_secure_password_here"
}
```

### Requirements
- Must be authenticated as an admin user
- New password must be at least 6 characters
- Target user must exist in the system

## Postman Collection
I've created a Postman collection (`AdminPasswordChange.postman_collection.json`) that you can import directly into Postman.

### Variables Used
- `baseUrl`: Set to your API base URL (default: `http://localhost:5000`)
- `token`: Will be automatically set after login
- `userId`: Set this to the ID of the user you want to change password for

### Steps to Use
1. Import the Postman collection
2. Set your environment variables (especially `baseUrl`)
3. Run the "Login as Admin" request first with valid admin credentials
4. The token will be automatically saved
5. Set the `userId` variable to the target user's ID
6. Run the "Admin Change User Password" request

## Example Flow
1. Login as admin to get JWT token
2. Use that token to authorize the password change request
3. Specify the target user's ID in the URL
4. Provide the new password in the request body
5. Receive success response with user data (password excluded)

## Security Notes
- Only users with `role: 'admin'` can access this endpoint
- The endpoint is protected by both authentication and authorization middleware
- Passwords are hashed using bcrypt before storage (same as regular password changes)
- No sensitive data is returned in the response
- Failed attempts return appropriate error messages

## Troubleshooting
- **401 Unauthorized**: Make sure you're logged in as admin and have a valid token
- **403 Forbidden**: Your account doesn't have admin role
- **404 Not Found**: The user ID you provided doesn't exist
- **400 Bad Request**: Validation failed (password too short, etc.)

## Files Modified
1. `src/modules/auth/auth.service.js` - Added `adminChangeUserPassword()` method
2. `src/modules/auth/auth.controller.js` - Added `adminChangePassword()` controller
3. `src/modules/auth/auth.routes.js` - Added route with admin protection
4. `src/modules/auth/auth.validators.js` - Added validation rules

## Testing
You can test this functionality by:
1. Logging in as an admin user
2. Getting a list of users (from another endpoint)
3. Selecting a user ID from the response
4. Using that ID in the password change endpoint