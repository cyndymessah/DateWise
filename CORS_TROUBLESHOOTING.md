# CORS Troubleshooting Guide for DateWise

## 🔍 Common CORS Issues and Solutions

### Issue 1: "Access to XMLHttpRequest has been blocked by CORS policy"

**Symptom:**
```
Access to XMLHttpRequest at 'https://backend.onrender.com/api/auth/login'
from origin 'https://frontend.onrender.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Cause:** Backend `ALLOWED_ORIGINS` doesn't include your frontend URL

**Solution:**
1. Go to your backend service on Render
2. Environment → Find `ALLOWED_ORIGINS`
3. Update to your **exact frontend URL** (no trailing slash):
   ```
   ALLOWED_ORIGINS=https://datewise-frontend.onrender.com
   ```
4. **Important:** URL must match EXACTLY - including `https://` and no trailing `/`
5. Save → Backend will redeploy (~2-3 min)

---

### Issue 2: "The value of the 'Access-Control-Allow-Origin' header contains multiple values"

**Symptom:**
```
The value of the 'Access-Control-Allow-Origin' header in the response
must not be the wildcard '*' when the request's credentials mode is 'include'.
```

**Cause:** CORS misconfiguration or multiple middleware applying CORS headers

**Solution:**
Backend already configured correctly. Ensure:
- ✅ `ALLOWED_ORIGINS` is set to specific URL(s)
- ✅ No other middleware is setting CORS headers
- ✅ No reverse proxy (like Nginx) adding extra CORS headers

---

### Issue 3: Whitespace in ALLOWED_ORIGINS

**Symptom:** CORS fails even though URL looks correct

**Bad Example:**
```bash
# DON'T do this (spaces after commas cause issues)
ALLOWED_ORIGINS=https://app1.com, https://app2.com
```

**Good Example:**
```bash
# DO this (no spaces, or use our automatic trimming)
ALLOWED_ORIGINS=https://app1.com,https://app2.com
```

**Built-in Fix:**
The backend now **automatically trims whitespace** from all origins, so both formats work!

---

### Issue 4: Mixed HTTP/HTTPS

**Symptom:** CORS fails on production but works locally

**Cause:** Frontend using `http://` in VITE_API_URL but backend is `https://`

**Solution:**
Always use HTTPS in production:
```bash
# Frontend environment variable
VITE_API_URL=https://your-backend.onrender.com/api  ✅
VITE_API_URL=http://your-backend.onrender.com/api   ❌
```

---

### Issue 5: Missing /api in VITE_API_URL

**Symptom:** 404 errors or incorrect CORS errors

**Cause:** Frontend requests go to wrong endpoint

**Wrong:**
```bash
VITE_API_URL=https://backend.onrender.com  ❌
```

**Correct:**
```bash
VITE_API_URL=https://backend.onrender.com/api  ✅
```

**Note:** Don't forget the `/api` at the end!

---

## ✅ Correct Environment Variable Setup

### Backend Environment Variables

```bash
# Required
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...

# CORS Configuration
CLIENT_URL=https://datewise-frontend.onrender.com
ALLOWED_ORIGINS=https://datewise-frontend.onrender.com

# ⚠️ For multiple origins (separate with commas, no spaces)
ALLOWED_ORIGINS=https://app.com,https://staging.app.com

# ✅ Also works (spaces automatically trimmed)
ALLOWED_ORIGINS=https://app.com, https://staging.app.com

# Auth
JWT_SECRET=<your-secret>
SESSION_SECRET=<your-secret>
ANTHROPIC_API_KEY=<your-key>
```

### Frontend Environment Variables

```bash
VITE_API_URL=https://datewise-backend.onrender.com/api
```

---

## 🔧 How to Debug CORS Issues

### Step 1: Check Backend Logs

When backend starts, you should see:
```
🔒 CORS enabled for origins: [ 'https://datewise-frontend.onrender.com' ]
```

**If you see:**
- `[ 'http://localhost:5173' ]` → You forgot to update ALLOWED_ORIGINS
- `[ '' ]` → ALLOWED_ORIGINS is empty
- Wrong URL → Fix ALLOWED_ORIGINS

### Step 2: Check Browser Network Tab

1. Open DevTools → Network tab
2. Look for failed request
3. Click on it → Headers tab
4. Check **Response Headers**:

**Should have:**
```
Access-Control-Allow-Origin: https://your-frontend.onrender.com
Access-Control-Allow-Credentials: true
```

**If missing:** Backend CORS not configured correctly

### Step 3: Check Request Origin

In Network tab → Request Headers:
```
Origin: https://datewise-frontend.onrender.com
```

This must **exactly match** what's in `ALLOWED_ORIGINS`

### Step 4: Test Backend Health Check

```bash
curl https://your-backend.onrender.com/api/health
```

**Should return:**
```json
{"status":"ok","timestamp":"2024-..."}
```

**If fails:** Backend isn't running or URL is wrong

---

## 🎯 Quick Checklist

Before deploying, verify:

- [ ] **Backend ALLOWED_ORIGINS** = exact frontend URL
- [ ] **Frontend VITE_API_URL** = backend URL + `/api`
- [ ] Both URLs use **https://** (not http://)
- [ ] **No trailing slashes** in URLs
- [ ] Backend logs show correct CORS origins on startup
- [ ] Browser Network tab shows `Access-Control-Allow-Origin` header
- [ ] No multiple CORS middleware or proxy adding headers

---

## 🔍 Common URL Mistakes

### ❌ Wrong

```bash
# Trailing slash
ALLOWED_ORIGINS=https://app.com/

# Missing https://
ALLOWED_ORIGINS=app.com

# Using localhost in production
ALLOWED_ORIGINS=http://localhost:5173

# Wrong API URL
VITE_API_URL=https://backend.com  # Missing /api

# Mixed protocols
ALLOWED_ORIGINS=http://app.com  # Should be https in production
```

### ✅ Correct

```bash
# Backend
ALLOWED_ORIGINS=https://datewise-frontend.onrender.com
CLIENT_URL=https://datewise-frontend.onrender.com

# Frontend
VITE_API_URL=https://datewise-backend.onrender.com/api
```

---

## 🚀 Testing CORS Locally

To test CORS configuration locally before deploying:

### Terminal 1 - Backend
```bash
cd backend
export ALLOWED_ORIGINS=http://localhost:5173
export CLIENT_URL=http://localhost:5173
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
# No VITE_API_URL needed (uses proxy in dev)
npm run dev
```

Visit: http://localhost:5173

**Should work without CORS errors**

---

## 🛡️ Security Notes

### DO NOT use wildcard in production:
```bash
# ❌ NEVER do this
ALLOWED_ORIGINS=*
```

### DO use specific origins:
```bash
# ✅ Always do this
ALLOWED_ORIGINS=https://your-exact-domain.com
```

### Multiple domains (staging + production):
```bash
# ✅ Comma-separated list
ALLOWED_ORIGINS=https://app.com,https://staging.app.com
```

---

## 📞 Still Having Issues?

If CORS still doesn't work after following this guide:

1. **Check backend logs** for CORS origins on startup
2. **Copy exact error** from browser console
3. **Check Network tab** for request/response headers
4. **Verify URLs** match exactly (copy-paste, don't type)
5. **Try redeploying** backend after changing ALLOWED_ORIGINS
6. **Clear browser cache** and hard refresh (Ctrl+Shift+R)

### Common "Hidden" Issues:

- **Browser cache**: Old CORS headers cached
  - Fix: Hard refresh or use Incognito mode

- **CDN caching**: Some CDNs cache CORS headers
  - Fix: Wait a few minutes or purge CDN cache

- **Environment variable typo**: `ALLOW_ORIGINS` vs `ALLOWED_ORIGINS`
  - Fix: Check exact variable name

- **Service not redeployed**: Changed env var but service didn't restart
  - Fix: Manually trigger redeploy

---

## 🎉 Success Indicators

Your CORS is working correctly when:

- ✅ No CORS errors in browser console
- ✅ Network tab shows `Access-Control-Allow-Origin` header
- ✅ API requests complete successfully
- ✅ Login and registration work
- ✅ All protected routes accessible after authentication
- ✅ Backend logs show correct origins on startup

---

## 🔄 What Changed in This Fix

### Backend Config (`src/config/index.ts`)

**Before:**
```javascript
allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']
```
❌ Problem: Doesn't trim whitespace, includes empty strings

**After:**
```javascript
allowedOrigins: process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:5173']
```
✅ Solution: Trims whitespace, filters out empty strings

### Frontend API Client (`src/services/api.ts`)

**Added:**
```javascript
withCredentials: true
```
✅ Matches backend's `credentials: true` setting

### Backend Logging (`src/index.ts`)

**Added:**
```javascript
console.log('🔒 CORS enabled for origins:', config.allowedOrigins);
```
✅ Shows which origins are allowed on startup (helps debugging)

---

**Last Updated:** 2024
**Applies to:** DateWise v1.0.0
