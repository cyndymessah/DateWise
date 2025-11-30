# Render Free Tier Deployment Guide

## 🎯 Free Tier Limitations Solved

Render's free tier **does NOT include Shell access**, but we've created workarounds so you can deploy without paying!

---

## ✨ Solution: Auto-Migration on Startup

Your backend now **automatically runs migrations and seeds** on first startup! No Shell needed.

### How It Works

When you deploy to Render with the updated configuration:

1. **Build Phase**: `npm install && npm run build` (compiles TypeScript)
2. **Start Phase**: `npm run start:prod` which:
   - ✅ Runs `migrate-and-seed.js` (sets up database)
   - ✅ Starts your Express server

**Benefits:**
- ✅ Completely automatic
- ✅ Idempotent (safe to run multiple times)
- ✅ No manual intervention needed
- ✅ Free tier compatible

---

## 🚀 Deployment Steps (Updated for Free Tier)

### Step 1: Create Render Account (1 min)
1. Go to https://render.com/
2. Sign up with GitHub
3. Authorize Render to access your DateWise repo

### Step 2: Deploy PostgreSQL Database (3 min)
1. Dashboard → **New +** → **PostgreSQL**
2. Configure:
   ```
   Name: datewise-db
   Database: datewise
   User: datewise
   Region: Singapore
   Plan: Free
   ```
3. Click **Create Database**
4. Wait ~1 minute for provisioning
5. **Copy the "Internal Database URL"** (you'll need this next)

### Step 3: Deploy Backend Web Service (5 min)
1. Dashboard → **New +** → **Web Service**
2. Select your **DateWise** repository
3. Configure:
   ```
   Name: datewise-backend
   Region: Singapore
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install --production=false && npm run build
   Start Command: npm run start:prod
   Plan: Free
   ```

   **Note:** The `--production=false` flag ensures devDependencies (like TypeScript types) are installed for the build.

4. **Environment Variables** - Click "Advanced" and add:
   ```bash
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<paste Internal Database URL from Step 2>
   JWT_SECRET=<paste your generated secret 1>
   SESSION_SECRET=<paste your generated secret 2>
   ANTHROPIC_API_KEY=<your Anthropic API key>
   CLIENT_URL=https://placeholder
   ALLOWED_ORIGINS=https://placeholder
   ```

   **Generate secrets locally:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   # Run twice for two different secrets
   ```

5. Click **Create Web Service**

6. **Watch the logs!** You should see:
   ```
   🔄 Starting database setup...
   📦 Running migrations...
   ✅ Migrations completed successfully
   🌱 Seeding database with activities...
   ✅ Seeded 33 activities
   🎉 Database setup completed successfully!
   ✅ All done!
   Server is running on port 3001
   ```

7. **Copy your backend URL** once deployed (e.g., `https://datewise-backend.onrender.com`)

### Step 4: Deploy Frontend Static Site (5 min)
1. Dashboard → **New +** → **Static Site**
2. Select your **DateWise** repository
3. Configure:
   ```
   Name: datewise-frontend
   Region: Singapore
   Branch: main
   Root Directory: frontend
   Build Command: npm install --production=false && npm run build
   Publish Directory: dist
   ```

4. **Environment Variable:**
   ```bash
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
   **Replace with your actual backend URL from Step 3!**

5. Click **Create Static Site**
6. Wait ~3-5 minutes for build
7. **Copy your frontend URL** (e.g., `https://datewise-frontend.onrender.com`)

### Step 5: Update Backend CORS (2 min)
1. Go to **Backend Service** → **Environment**
2. Update these two variables:
   ```bash
   CLIENT_URL=https://your-frontend-url.onrender.com
   ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
   ```
3. Click **Save Changes**
4. Backend will auto-redeploy (~2-3 min)

### Step 6: Test Your App! 🎉
1. Visit your frontend URL
2. **First load will be slow** (backend waking up ~30-40s)
3. Create an account
4. Log in
5. Complete onboarding
6. Select activities
7. View daily matches

---

## 🔄 Alternative: Run Migrations Locally

If you prefer to run migrations from your local machine:

### Option A: Using npm script (Recommended)

```bash
# 1. Get your DATABASE_URL from Render
#    Backend Service → Environment → DATABASE_URL

# 2. Set it temporarily in your terminal
export DATABASE_URL="postgresql://datewise:..."

# 3. Run migrations from your local machine
cd backend
npm run migrate:prod
```

### Option B: Manual connection

```bash
# 1. Install PostgreSQL client locally (if not already)
# macOS:
brew install postgresql

# Ubuntu/Debian:
sudo apt-get install postgresql-client

# 2. Connect to Render database
psql "postgresql://datewise:password@host/database"

# 3. Manually run SQL from migrations/001_initial_schema.sql
```

---

## 🛠️ Troubleshooting

### Issue: "Cannot connect to database" on startup

**Check:**
1. DATABASE_URL is set correctly in environment
2. Database service is running (check Render dashboard)
3. Internal Database URL was used (not External)

**Fix:**
- Go to Database → Connection → Copy "Internal Database URL"
- Update DATABASE_URL in backend service
- Save and redeploy

### Issue: Migrations run but activities are missing

**Cause:** Seed portion may have failed

**Fix:**
Run migrations manually from local machine:
```bash
export DATABASE_URL="your-render-database-url"
cd backend
npm run migrate:prod
```

Check logs for:
```
✅ Seeded 33 activities
```

### Issue: "Migration failed" in logs

**Common causes:**
1. Database not accessible
2. DATABASE_URL incorrect
3. PostgreSQL extensions not enabled

**Check database logs:**
- Go to Database service → Logs
- Look for connection errors

**Fix:**
- Ensure database is running
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Check database accepts connections

### Issue: Backend keeps restarting

**Cause:** Migration script might be failing repeatedly

**Debug:**
1. Check backend logs for error message
2. Look for SQL errors
3. Check if migration SQL file exists

**Temporary fix:**
Change start command to:
```bash
npm start
```
This skips auto-migration. Then run migrations manually (see Alternative options above).

---

## 📋 Deployment Checklist

- [ ] Generated JWT_SECRET and SESSION_SECRET (64+ chars each)
- [ ] Got Anthropic API key
- [ ] Created Render account
- [ ] Deployed PostgreSQL database (free tier)
- [ ] Copied Internal Database URL
- [ ] Deployed backend with all environment variables
- [ ] Watched logs - saw "Database setup completed successfully!"
- [ ] Backend is running (visit /api/health)
- [ ] Deployed frontend with VITE_API_URL
- [ ] Updated backend CORS settings with frontend URL
- [ ] Tested: Create account, login, onboarding, activities
- [ ] No CORS errors in browser console

---

## 🎯 What You Get (Free)

**Database:**
- ✅ PostgreSQL 256MB (never sleeps)
- ✅ Auto-backup for 90 days
- ✅ Persistent data

**Backend:**
- ✅ 750 hours/month (plenty for dev/MVP)
- ✅ Sleeps after 15 min idle
- ✅ Auto-migrations on startup
- ⚠️ Cold start: 30-40s after sleep

**Frontend:**
- ✅ Unlimited bandwidth
- ✅ Never sleeps
- ✅ CDN-backed
- ✅ Auto-deploy on git push

**Cost:** $0/month forever (with limitations above)

---

## 💰 When to Upgrade

Consider upgrading backend to **Starter plan ($7/month)** when:
- [ ] You have real users (10+)
- [ ] Cold starts frustrate users
- [ ] You need 24/7 uptime
- [ ] You're getting traffic daily

Database upgrade to **Standard ($25/month)** when:
- [ ] Approaching 256MB storage
- [ ] Need daily backups
- [ ] Need better performance

---

## 🚀 Continuous Deployment

Already set up! Every `git push` to main:

```bash
git add .
git commit -m "New feature"
git push origin main

# Render automatically:
# 1. Builds backend (2-5 min)
# 2. Runs migrations if needed
# 3. Starts server
# 4. Builds frontend (2-3 min)
# 5. Deploys to CDN
```

---

## 📞 Getting Help

**Migration Issues:**
- Check backend logs for exact error
- Verify DATABASE_URL format
- Try manual migration (see Alternative options)

**CORS Issues:**
- Ensure CLIENT_URL matches frontend URL exactly
- No trailing slashes
- Use https:// not http://

**Database Issues:**
- Check database is running (Render dashboard)
- Verify Internal URL (not External)
- Check connection string format

**Backend Won't Start:**
- Check all required env vars are set
- Look for errors in logs
- Temporarily use `npm start` instead of `npm run start:prod`

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Backend logs show "Database setup completed successfully!"
2. ✅ Health check works: `https://your-backend.onrender.com/api/health`
3. ✅ Frontend loads without errors
4. ✅ Can create account and login
5. ✅ Can select activities (proves database seeded correctly)
6. ✅ No CORS errors in browser console
7. ✅ Migrations ran automatically (check logs)

---

**Ready to deploy? Follow the steps above!** 🚀

Total time: ~20-30 minutes
Cost: $0 (free tier)
Complexity: Low (automatic migrations)
