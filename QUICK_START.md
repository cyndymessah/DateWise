# DateWise - Quick Start Deployment Guide

## 🚀 Deploy in 15 Minutes

### Prerequisites
- GitHub account
- Anthropic API key ([Get one here](https://console.anthropic.com/))
- Choose your platform:
  - **Railway** (Recommended) - Get $5 credit
  - **Render** - Free forever tier
  - **Vercel** - Free for frontend

---

## Option 1: Railway (All-in-One) ⭐ FASTEST

### Step 1: Deploy Backend + Database (5 min)

1. **Sign up:** https://railway.app/
2. **New Project → Deploy from GitHub**
   - Select `DateWise` repository
   - Railway auto-detects monorepo
3. **Add PostgreSQL:**
   - Click "+ New" → Database → PostgreSQL
   - Railway auto-connects `DATABASE_URL`
4. **Configure Backend Service:**
   ```
   Name: datewise-backend
   Root Directory: /backend
   ```
5. **Set Environment Variables:**
   Click on backend service → Variables tab:
   ```
   NODE_ENV=production
   JWT_SECRET=<generate-random-64-chars>
   SESSION_SECRET=<generate-random-64-chars>
   ANTHROPIC_API_KEY=<your-key>
   CLIENT_URL=https://yourapp.vercel.app
   ALLOWED_ORIGINS=https://yourapp.vercel.app
   ```

   **Generate secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

6. **Run Migrations:**
   - After deploy completes, go to service → Settings
   - Click "Run a command"
   - Enter: `npm run migrate`
   - Run again with: `npm run seed`

7. **Get Backend URL:**
   - Go to Settings → Domains
   - Copy the Railway domain (e.g., `datewise-backend-production.up.railway.app`)

### Step 2: Deploy Frontend (5 min)

1. **Sign up:** https://vercel.com/
2. **New Project → Import Git Repository**
3. **Configure:**
   ```
   Framework: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
4. **Environment Variable:**
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app/api
   ```
5. **Deploy** - Takes ~2 minutes

### Step 3: Update Backend CORS (2 min)

1. Go back to Railway → Backend service → Variables
2. Update:
   ```
   CLIENT_URL=https://your-app.vercel.app
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
3. Save (auto-redeploys)

### ✅ Done! Test Your App
Visit `https://your-app.vercel.app` and create an account!

---

## Option 2: Render (Free Forever Tier)

### Step 1: Deploy Backend + Database (7 min)

1. **Sign up:** https://render.com/
2. **New → PostgreSQL**
   - Name: `datewise-db`
   - Plan: Free
   - Create Database
   - Copy **Internal Database URL**
3. **New → Web Service**
   - Connect GitHub repo
   - Name: `datewise-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. **Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=<paste-internal-db-url>
   JWT_SECRET=<generate-64-chars>
   SESSION_SECRET=<generate-64-chars>
   ANTHROPIC_API_KEY=<your-key>
   CLIENT_URL=https://yourapp.vercel.app
   ALLOWED_ORIGINS=https://yourapp.vercel.app
   ```
5. **Create Web Service** - Wait ~5-10 min for build
6. **Run Migrations:**
   - Go to Shell tab
   - Run: `npm run migrate && npm run seed`

### Step 2: Deploy Frontend on Vercel (5 min)

Same as Railway Option above.

### ✅ Note: Free Tier Limitations
- Backend sleeps after 15 min inactivity
- First request takes ~30s (cold start)
- Upgrade to $7/month for always-on

---

## Option 3: One-Click Render Deploy

Use the included `render.yaml`:

1. **Fork this repo to your GitHub**
2. **Go to:** https://render.com/
3. **New → Blueprint**
4. **Connect repository**
5. **Render auto-detects `render.yaml`**
6. **Set required environment variables:**
   - `ANTHROPIC_API_KEY`
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `CLIENT_URL` (after frontend deploys)
   - `VITE_API_URL` (after backend deploys)
7. **Apply** - Deploys everything!

### Update URLs After Deploy
1. Frontend deploys first → Get URL
2. Backend deploys → Get URL
3. Update environment variables:
   - Backend: `CLIENT_URL` = frontend URL
   - Frontend: `VITE_API_URL` = backend URL + `/api`
4. Manually redeploy both services

---

## Verification Checklist

After deployment:

- [ ] Backend health check: `https://your-backend-url/api/health`
- [ ] Frontend loads without errors
- [ ] Can create an account
- [ ] Can log in
- [ ] Can update profile
- [ ] Can select activities
- [ ] Check browser console for CORS errors

---

## Troubleshooting

### "Network Error" on frontend
**Fix:** Update `VITE_API_URL` environment variable in Vercel:
```
VITE_API_URL=https://your-backend-url/api
```
Don't forget the `/api` at the end!

### CORS Error
**Fix:** Update backend environment variables:
```
CLIENT_URL=https://your-exact-frontend-url.vercel.app
ALLOWED_ORIGINS=https://your-exact-frontend-url.vercel.app
```
Make sure URLs match exactly (no trailing slash).

### Database Connection Failed
**Railway:** DATABASE_URL should auto-populate
**Render:** Copy "Internal Database URL" from database page

### 500 Error on Login/Register
**Fix:** Check backend logs:
- Railway: Service → Logs tab
- Render: Service → Logs tab

Common issues:
- Missing `JWT_SECRET`
- Database migrations not run
- Database not seeded with activities

### Run Migrations
**Railway:**
```bash
# Via CLI
railway run npm run migrate
railway run npm run seed

# Or via dashboard
Service → Settings → "Run a command"
```

**Render:**
```bash
# Via Shell tab in dashboard
npm run migrate && npm run seed
```

---

## Environment Variables Quick Reference

### Backend Required
```bash
DATABASE_URL=          # Auto-set by Railway/Render
JWT_SECRET=           # Generate random 64+ chars
SESSION_SECRET=       # Generate random 64+ chars
ANTHROPIC_API_KEY=    # From console.anthropic.com
CLIENT_URL=           # Your frontend URL
ALLOWED_ORIGINS=      # Your frontend URL
NODE_ENV=production
```

### Frontend Required
```bash
VITE_API_URL=         # Your backend URL + /api
```

---

## Cost Summary

### Free Option (Render + Vercel)
- **Cost:** $0/month
- **Limitations:** Backend sleeps after 15 min
- **Best for:** MVPs, portfolios, testing

### Affordable Option (Railway + Vercel)
- **Cost:** ~$5-10/month
- **Limitations:** None (always-on)
- **Best for:** Active development, small user base

### Production Option (Railway/Render Paid + Vercel)
- **Cost:** ~$20-30/month
- **Limitations:** None
- **Best for:** Production apps with users

---

## Next Steps After Deployment

1. **Custom Domain:** Add your own domain in Vercel/Railway
2. **Monitoring:** Set up error tracking (Sentry, LogRocket)
3. **Analytics:** Add Google Analytics or Mixpanel
4. **Email:** Configure SendGrid for notifications
5. **File Uploads:** Set up Cloudinary for profile photos
6. **Backup:** Enable database backups (paid plans)
7. **CI/CD:** Already configured! Just `git push`

---

## Getting Help

- **Railway:** https://railway.app/help
- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/support
- **DateWise Issues:** [Open an issue on GitHub]

---

## Pro Tips

1. **Deploy backend first** - You need the URL for frontend env var
2. **Test locally** - Run `npm run dev` from root before deploying
3. **Check logs** - Always check deployment logs for errors
4. **Use secrets** - Never commit `.env` files
5. **Monitor costs** - Set up billing alerts on Railway
6. **Enable 2FA** - Secure your deployment accounts
7. **Backup DATABASE_URL** - Save it somewhere safe

---

**Ready to deploy? Start with Railway + Vercel for the best experience!**

For detailed configuration and advanced options, see `DEPLOYMENT.md`.
