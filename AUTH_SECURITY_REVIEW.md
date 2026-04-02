# Authentication & RBAC Security Review

## 🟢 WHAT'S WORKING CORRECTLY

### 1. Registration Flow ✅
```
User submits (email, password, name)
    ↓
supabase.auth.signUp() → creates auth.users record
    ↓
Insert into users table with role="viewer"
    ↓
If profile insert fails → Delete auth user (cleanup)
    ↓
Return JWT token to client
```

**Status: CORRECT** - Prevents orphaned auth users, sets default role

### 2. Role-Based Access Control ✅
- **Backend Middleware**: `verifyRole()` function checks user role
- **Protected Routes**:
  - `POST /api/posts` → requires `["author", "admin"]`
  - `PUT /api/posts/[id]` → requires role + ownership check
  - `DELETE /api/posts/[id]` → requires role + ownership check
  - `POST /api/comments` → requires authenticated user

**Status: CORRECT** - Roles enforced at API level

### 3. Auth Context ✅
- Listens to `onAuthStateChange()` events
- Fetches user profile from users table
- Provides helper properties: `isAuthor`, `isAdmin`, `isAuthenticated`

**Status: CORRECT** - Good real-time state management

### 4. Database Schema ✅
- Users table references `auth.users` with CASCADE delete
- Role enum enforces: viewer | author | admin
- RLS policies protect all tables

**Status: CORRECT** - Proper relational design

---

## 🟡 CRITICAL ISSUES TO FIX

### Issue #1: Missing Authorization Header in API Calls
**Severity: HIGH** 🔴

**Problem:**
- Register/Login endpoints return `access_token` in response
- BUT frontend fetch calls don't send this token
- API middleware expects `Authorization: Bearer <token>` header
- **Currently, all protected endpoints will fail!**

**Current code (BROKEN):**
```typescript
// app/page.tsx
const response = await fetch("/api/posts?page=1");
// ❌ No Authorization header - API will reject it!
```

**Fix:**
```typescript
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

// Usage:
const response = await fetchWithAuth("/api/posts?page=1");
```

---

### Issue #2: Token Refresh Not Implemented
**Severity: HIGH** 🔴

**Problem:**
- Supabase JWT tokens expire in 1 hour
- No automatic refresh mechanism
- Users will get `401 Unauthorized` after token expires
- Need to refresh token before it expires or catch 401 and refresh

**Fix - Add to `/app/lib/auth.ts`:**
```typescript
export async function getValidToken(): Promise<string | null> {
  // Get current session
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  // Check if token expires in next 60 seconds
  const expiresAt = data.session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  
  if (expiresAt && expiresAt - now < 60) {
    // Refresh token
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session) return null;
    return refreshed.session.access_token;
  }

  return data.session.access_token;
}
```

---

### Issue #3: Email Verification Not Enforced
**Severity: MEDIUM** 🟡

**Problem:**
- User registers but email not verified yet
- By default, user can immediately create posts
- In production, should prevent actions until email confirmed

**Current behavior:**
```typescript
// Register endpoint
const { data: authData } = await supabase.auth.signUp({ email, password });
// User is now in users table even though email_confirmed = false
// Can immediately create posts
```

**Fix - Add email verification check:**
```typescript
// In /app/api/posts/route.ts (POST handler)
export async function POST(request: NextRequest) {
  const verification = await verifyRole(request, ["author", "admin"]);
  
  // NEW: Check email verification
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email_confirmed")
    .eq("id", verification.user!.id)
    .single();

  if (!user?.email_confirmed) {
    return errorResponse("Please verify your email first", 403);
  }

  // ... rest of post creation
}
```

**And update database schema:**
```sql
ALTER TABLE users ADD COLUMN email_confirmed BOOLEAN DEFAULT false;
-- Add trigger to sync with auth.users.email_confirmed_at
```

---

### Issue #4: No Explicit Rate Limiting on Auth Endpoints
**Severity: MEDIUM** 🟡

**Problem:**
- Register/login endpoints have no rate limiting
- Vulnerable to brute force attacks
- Supabase provides some limiting but no explicit control

**Quick fix - Add Supabase Auth settings:**
1. Go to: https://ssmwdgyhreqqwtxbuspz.supabase.co/project/settings/auth
2. Find: "Rate limiting"
3. Enable password reset rate limit
4. Enable custom email/SMS rate limits

---

### Issue #5: Missing Error Handling in fetchUserProfile
**Severity: MEDIUM** 🟡

**Problem:**
In `app/context/AuthContext.tsx`:
```typescript
const fetchUserProfile = async (userId: string) => {
  // ... code
  const { data, error: err } = await supabase
    .from("users")
    .select("*")
    // ❌ No error handling - fails silently when users table doesn't exist
    .eq("id", userId)
    .single();
};
```

**Fix:**
```typescript
const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error: err } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (err) {
      console.error("Profile fetch error:", err);
      if (err.code === "PGRST116") {
        // User not found - create profile
        await supabase.from("users").insert([{
          id: userId,
          role: "viewer",
        }]);
        return;
      }
      setError(err.message);
      return;
    }

    setUserProfile(data);
  } catch (error) {
    setError(error instanceof Error ? error.message : "Unknown error");
  }
};
```

---

## 🟢 ADDITIONAL IMPROVEMENTS (RECOMMENDED)

### 1. Create Wrapper Hook for Protected Fetches
**File: `/app/hooks/useAuthFetch.ts`**

```typescript
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/app/lib/supabase";

export function useAuthFetch() {
  const { user } = useAuth();

  const fetchWithAuth = async (
    url: string,
    options: RequestInit = {}
  ) => {
    if (!user) throw new Error("Not authenticated");

    // Get fresh token
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) throw new Error("No valid session");

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle 401 - token expired
    if (response.status === 401) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (!refreshed.session?.access_token) throw new Error("Session expired");

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${refreshed.session.access_token}`,
        },
      });
    }

    return response;
  };

  return { fetchWithAuth };
}
```

**Usage in components:**
```typescript
const { fetchWithAuth } = useAuthFetch();
const response = await fetchWithAuth("/api/posts", {
  method: "POST",
  body: JSON.stringify({ title, body }),
});
```

---

### 2. Add Security Headers to API Routes
**File: `/app/api/middleware.ts` (create if doesn't exist)**

```typescript
import { NextResponse } from "next/server";

export function addSecurityHeaders(response: NextResponse) {
  response.headers.set(
    "X-Content-Type-Options",
    "nosniff"
  );
  response.headers.set(
    "X-Frame-Options",
    "DENY"
  );
  response.headers.set(
    "X-XSS-Protection",
    "1; mode=block"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  return response;
}
```

Use in API routes:
```typescript
return addSecurityHeaders(successResponse({ message: "OK" }));
```

---

## 📋 IMPLEMENTATION CHECKLIST

**Priority 1 (Critical - Do These First):**
- [ ] Add Authorization header to all fetch calls
- [ ] Implement token refresh mechanism
- [ ] Test protected API endpoints

**Priority 2 (High - Do Next):**
- [ ] Add email verification check
- [ ] Add error handling in AuthContext
- [ ] Create `useAuthFetch` hook

**Priority 3 (Medium - Polish):**
- [ ] Add security headers
- [ ] Configure rate limiting in Supabase
- [ ] Add audit logging for auth events

---

## 🧪 TEST THE FLOW

After fixes:

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# 2. Get token from response
# ACCESS_TOKEN=abc123...

# 3. Create post WITH token
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{"title":"My Post","body":"Content here"}'

# 4. Should succeed with role check
```

---

## Summary

| Component | Status | Issues | Priority |
|-----------|--------|--------|----------|
| Register Flow | ✅ | None | - |
| Role Checking | ✅ | Web client doesn't send token | HIGH |
| Database Schema | ✅ | None | - |
| Auth Context | ✅ | Silent failures, no token mgmt | MEDIUM |
| Token Refresh | ❌ | Not implemented | HIGH |
| Email Verification | ⚠️ | Not enforced | MEDIUM |
| Security Headers | ❌ | Not added | MEDIUM |

**Priority Action:** Fix token sending in fetch calls before anything else!
