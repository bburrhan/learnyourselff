# LearnYourself Mobile API Reference

This API is a single Supabase Edge Function that powers the LearnYourself mobile app.

## Base URL

```
https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api
```

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Obtain the token from `POST /auth/login` or `POST /auth/whatsapp/verify-otp`. Refresh it with `POST /auth/refresh` before it expires.

## Standard Error Response

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Common codes: `UNAUTHORIZED`, `NOT_FOUND`, `MISSING_FIELDS`, `DB_ERROR`, `INTERNAL_ERROR`

---

## Auth Endpoints

### Register

`POST /auth/register`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "Jane Doe"
}
```

**Response `201`:**
```json
{
  "user": { "id": "uuid", "email": "user@example.com", "full_name": "Jane Doe" },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_at": 1234567890
}
```

---

### Login

`POST /auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response `200`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "language_preference": "en"
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_at": 1234567890
}
```

---

### Logout

`POST /auth/logout` *(requires auth)*

**Response `200`:**
```json
{ "success": true }
```

---

### Refresh Token

`POST /auth/refresh`

**Body:**
```json
{ "refresh_token": "eyJ..." }
```

**Response `200`:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_at": 1234567890
}
```

---

### Forgot Password

`POST /auth/forgot-password`

**Body:**
```json
{
  "email": "user@example.com",
  "redirect_url": "myapp://reset-password"
}
```

**Response `200`:**
```json
{ "success": true, "message": "Password reset email sent" }
```

---

### Reset Password

`POST /auth/reset-password` *(requires auth — use the token from the reset email link)*

**Body:**
```json
{ "password": "newpassword123" }
```

**Response `200`:**
```json
{ "success": true, "message": "Password updated successfully" }
```

---

### Send WhatsApp / SMS OTP

`POST /auth/whatsapp/send-otp`

Sends a 6-digit verification code via SMS to the given phone number using Twilio Verify.

**Body:**
```json
{
  "phone_number": "+905551234567",
  "purpose": "login",
  "language": "tr"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `phone_number` | string | Yes | Phone number in E.164 format (e.g. `+905551234567`). Leading `0` is auto-corrected. |
| `purpose` | string | No | `login`, `signup`, or `checkout`. Default: `login` |
| `language` | string | No | Language code for the SMS message. Default: `en` |

**Response `200`:**
```json
{
  "success": true,
  "phone_number": "+905551234567",
  "expires_in": 600,
  "message": "Verification code sent successfully"
}
```

**Error codes:** `INVALID_PHONE` (400), `SMS_SEND_FAILED` (502)

---

### Verify WhatsApp / SMS OTP

`POST /auth/whatsapp/verify-otp`

Verifies the OTP code and returns a session. Creates a new account automatically if the phone number is not yet registered.

**Body:**
```json
{
  "phone_number": "+905551234567",
  "otp_code": "123456",
  "purpose": "login",
  "full_name": "Jane Doe",
  "language": "tr"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `phone_number` | string | Yes | Same number used in `send-otp` |
| `otp_code` | string | Yes | 6-digit code received via SMS |
| `purpose` | string | No | `login`, `signup`, or `checkout`. Default: `login` |
| `full_name` | string | No | Used when creating a new account |
| `language` | string | No | Language preference for the new account. Default: `en` |

**Response `200`:**
```json
{
  "success": true,
  "is_new_user": false,
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_at": 1234567890,
  "user": {
    "id": "uuid",
    "phone_number": "+905551234567",
    "full_name": "Jane Doe",
    "language_preference": "tr"
  }
}
```

`is_new_user: true` when a new account was created during this call.

**Error codes:** `INVALID_OTP` (400), `SESSION_FAILED` (500)

---

## Category Endpoints

### List Categories

`GET /categories`

**Response `200`:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Personal Development",
      "slug": "personal-development",
      "description": "...",
      "color": "#3B82F6",
      "icon": "star",
      "sort_order": 1
    }
  ]
}
```

---

## Course Endpoints

### List Courses

`GET /courses`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `language` | string | Filter by language code (`en`, `tr`, `hi`, etc.) |
| `category` | string | Filter by category name |
| `search` | string | Search in title and description |
| `min_price` | number | Minimum price |
| `max_price` | number | Maximum price |
| `is_featured` | boolean | `true` to return featured courses only |
| `format_type` | string | Filter by a single format type (e.g. `book`, `guide`, `checklist`, `listicle`, `notion-template`, `email-course`, `podcast`, `prompt-pack`, `toolstack`, `workbook`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |

**Response `200`:**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Master Your Mindset",
      "description": "...",
      "price": 29.99,
      "currency": "USD",
      "category": "Personal Development",
      "cover_image_url": "https://...",
      "tags": ["mindset", "habits"],
      "language": "en",
      "content_types": ["video", "audio"],
      "format_types": ["guide", "workbook"],
      "is_featured": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

### Get Course Detail

`GET /courses/:id`

**Response `200`:**
```json
{
  "course": {
    "id": "uuid",
    "title": "Master Your Mindset",
    "description": "...",
    "price": 29.99,
    "currency": "USD",
    "cover_image_url": "https://...",
    "tags": ["mindset"],
    "language": "en",
    "content_types": ["video"],
    "format_types": ["guide"],
    "is_featured": false,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  },
  "content_preview": [
    {
      "id": "uuid",
      "title": "Introduction",
      "content_type": "video",
      "duration_seconds": 360,
      "sort_order": 1,
      "file_size": 102400
    }
  ]
}
```

---

### Get Course Content (with signed URLs)

`GET /courses/:id/learn` *(requires auth + completed purchase)*

Returns full content list with 1-hour signed download/stream URLs.

**Response `200`:**
```json
{
  "content": [
    {
      "id": "uuid",
      "title": "Introduction",
      "content_type": "video",
      "file_url": "https://storage.supabase.co/...",
      "signed_url": "https://storage.supabase.co/...?token=...",
      "duration_seconds": 360,
      "file_size": 102400,
      "sort_order": 1,
      "is_active": true
    }
  ]
}
```

**Error `403`:** `PURCHASE_REQUIRED` — user has not purchased the course.

---

### Get Course Progress

`GET /courses/:id/progress` *(requires auth)*

**Response `200`:**
```json
{
  "progress": [
    {
      "id": "uuid",
      "content_id": "uuid",
      "progress_seconds": 120,
      "progress_percent": 33,
      "completed": false,
      "last_accessed_at": "2025-01-01T00:00:00Z"
    }
  ],
  "completed_items": 2,
  "total_items": 8,
  "overall_percent": 25
}
```

---

### Save Course Progress

`POST /courses/:id/progress` *(requires auth)*

**Body:**
```json
{
  "content_id": "uuid",
  "progress_seconds": 120,
  "progress_percent": 33,
  "completed": false
}
```

**Response `200`:**
```json
{
  "progress": { "id": "uuid", "content_id": "uuid", "progress_percent": 33, "completed": false }
}
```

---

## User Endpoints

### Get My Profile

`GET /me` *(requires auth)*

**Response `200`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "language_preference": "en",
    "phone_number": "+905551234567",
    "whatsapp_verified": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

`phone_number` and `whatsapp_verified` are present for users who authenticated via WhatsApp OTP. They may be `null` for email/password users.

---

### Update My Profile

`PATCH /me` *(requires auth)*

**Body (all fields optional):**
```json
{
  "full_name": "Jane Smith",
  "language_preference": "tr"
}
```

**Response `200`:**
```json
{
  "user": { "id": "uuid", "full_name": "Jane Smith", "language_preference": "tr" }
}
```

---

### Get My Courses

`GET /me/courses` *(requires auth)*

Returns all purchased courses with progress.

**Response `200`:**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Master Your Mindset",
      "cover_image_url": "https://...",
      "content_types": ["video"],
      "format_types": ["guide", "workbook"],
      "language": "en",
      "purchase_id": "uuid",
      "purchased_at": "2025-01-01T00:00:00Z",
      "overall_progress": 45,
      "completed_items": 3,
      "total_items": 8
    }
  ]
}
```

---

### Get My Purchase History

`GET /me/purchases` *(requires auth)*

**Response `200`:**
```json
{
  "purchases": [
    {
      "id": "uuid",
      "course_id": "uuid",
      "amount": 29.99,
      "currency": "USD",
      "status": "completed",
      "stripe_payment_id": "pi_...",
      "created_at": "2025-01-01T00:00:00Z",
      "download_count": 2,
      "course": {
        "id": "uuid",
        "title": "Master Your Mindset",
        "cover_image_url": "https://..."
      }
    }
  ]
}
```

---

### Register Push Notification Token

`POST /me/push-token` *(requires auth)*

**Body:**
```json
{
  "token": "ExponentPushToken[xxxx]",
  "platform": "ios"
}
```

**Response `200`:**
```json
{ "success": true }
```

---

## Checkout Endpoints

### Enroll in Free Course

`POST /checkout/free`

**Body:**
```json
{
  "course_id": "uuid",
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "language": "en"
}
```

**Response `201`:**
```json
{
  "purchase_id": "uuid",
  "message": "Enrolled successfully"
}
```

If already enrolled, returns `200` with the existing `purchase_id` and `"Already enrolled"`.

---

### Create Stripe Checkout Session

`POST /checkout/stripe`

Either `email` or `phone_number` must be provided (or both).

**Body:**
```json
{
  "course_id": "uuid",
  "email": "user@example.com",
  "phone_number": "+905551234567",
  "full_name": "Jane Doe",
  "success_url": "myapp://checkout/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "myapp://courses/uuid?canceled=true",
  "language": "en"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `course_id` | string | Yes | Course UUID |
| `email` | string | Conditional | Customer email. Required if `phone_number` is not provided. |
| `phone_number` | string | Conditional | Customer phone in E.164 format. Required if `email` is not provided. Used to link the purchase to a WhatsApp-authenticated user. |
| `full_name` | string | No | Customer name shown in Stripe checkout |
| `success_url` | string | No | Redirect URL after payment. Use `{CHECKOUT_SESSION_ID}` placeholder. |
| `cancel_url` | string | No | Redirect URL when payment is cancelled. |
| `language` | string | No | Language preference (`en`, `tr`, `hi`). Default: `en` |

**Response `200`:**
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/pay/cs_..."
}
```

Open `url` in an in-app browser or WebView. On success, Stripe redirects to `success_url` with `session_id` appended.

---

### Verify Stripe Session (after payment)

`POST /checkout/verify-stripe-session`

Call this after the user returns from Stripe checkout to confirm the payment and record the purchase. Does **not** require authentication — suitable for WhatsApp-only users who do not have an active session.

**Body:**
```json
{
  "sessionId": "cs_...",
  "language": "en"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | Yes | Stripe Checkout Session ID from the redirect URL |
| `language` | string | No | Language for confirmation email. Default: `en` |

**Response `200`:**
```json
{
  "success": true,
  "purchase_id": "uuid",
  "course_id": "uuid",
  "course_title": "Master Your Mindset",
  "full_name": "Jane Doe",
  "amount": 29.99,
  "currency": "USD",
  "is_new_user": false,
  "already_processed": false
}
```

`already_processed: true` is returned (with `200`) if the session was already verified before (idempotent).

**Error `400`:** Payment not completed (`payment_status` is not `paid`).

---

### Verify Purchase by ID

`GET /checkout/verify/:purchaseId` *(requires auth)*

Verify ownership of a specific purchase record. Useful for access-gating screens.

**Response `200`:**
```json
{
  "purchase": {
    "id": "uuid",
    "status": "completed",
    "course_id": "uuid",
    "amount": 29.99,
    "currency": "USD",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

## Blog Endpoints

### List Blog Posts

`GET /blog`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `language` | string | Filter by language code |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10, max: 50) |

**Response `200`:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "5 Habits That Changed My Life",
      "excerpt": "...",
      "slug": "5-habits-that-changed-my-life",
      "author_name": "John Smith",
      "cover_image_url": "https://...",
      "tags": ["habits", "mindset"],
      "language": "en",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 25, "total_pages": 3 }
}
```

---

### Get Blog Post

`GET /blog/:slug`

**Response `200`:**
```json
{
  "post": {
    "id": "uuid",
    "title": "5 Habits That Changed My Life",
    "content": "<full html content>",
    "excerpt": "...",
    "slug": "5-habits-that-changed-my-life",
    "author_name": "John Smith",
    "cover_image_url": "https://...",
    "tags": ["habits"],
    "language": "en",
    "is_published": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

## Example: Email/Password Login Flow

```bash
# 1. Login
curl -X POST https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'

# 2. Browse courses
curl "https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/courses?language=en&page=1"

# 3. Get course detail
curl "https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/courses/COURSE_ID"

# 4. Enroll in free course
curl -X POST https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/checkout/free \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{"course_id":"COURSE_ID","email":"user@example.com","full_name":"Jane"}'

# 5. Access course content (signed URLs)
curl "https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/courses/COURSE_ID/learn" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# 6. Save progress
curl -X POST "https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/courses/COURSE_ID/progress" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{"content_id":"CONTENT_ID","progress_seconds":120,"progress_percent":33,"completed":false}'

# 7. Get my enrolled courses
curl "https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/me/courses" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## Example: WhatsApp OTP Login Flow

```bash
# 1. Send OTP to phone
curl -X POST https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/auth/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+905551234567","purpose":"login","language":"tr"}'

# 2. Verify OTP — returns access_token (creates account if new user)
curl -X POST https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/auth/whatsapp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+905551234567","otp_code":"123456","purpose":"login","language":"tr"}'

# 3. Browse and view courses (same as email flow)
curl "https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/courses?language=tr"

# 4. Start Stripe checkout for a paid course (phone_number links purchase to user)
curl -X POST https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/checkout/stripe \
  -H "Content-Type: application/json" \
  -d '{"course_id":"COURSE_ID","phone_number":"+905551234567","full_name":"Jane","success_url":"myapp://success?session_id={CHECKOUT_SESSION_ID}","cancel_url":"myapp://cancel","language":"tr"}'

# 5. After returning from Stripe, verify the session (no auth required)
curl -X POST https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/checkout/verify-stripe-session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"cs_...","language":"tr"}'

# 6. Access purchased course content using the token from step 2
curl "https://mkupsvtavdcvqafajeef.supabase.co/functions/v1/api/courses/COURSE_ID/learn" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```
