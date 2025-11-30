# DateWise Deployment Guide

## Recommended: Railway (Backend + DB) + Vercel (Frontend)

### Prerequisites
- GitHub repository (already have ✓)
- Railway account (free): https://railway.app
- Vercel account (free): https://vercel.com
- Anthropic API key

---

## Step 1: Deploy Backend + Database to Railway

### 1.1 Create Railway Project
```bash
# Option A: Railway CLI
npm i -g @railway/cli
railway login
railway init
railway link

# Option B: Use Railway Dashboard (easier)
# Go to https://railway.app/new
# Click "Deploy from GitHub repo"
# Select your DateWise repository
```

### 1.2 Add PostgreSQL Database
1. In Railway dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway automatically creates `DATABASE_URL` variable

### 1.3 Configure Backend Service
```
Service Name: datewise-backend
Root Directory: /backend
Build Command: npm install && npm run build
Start Command: npm start
```

### 1.4 Set Environment Variables
In Railway dashboard, go to Variables tab:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-linked
JWT_SECRET=<generate-strong-secret>
SESSION_SECRET=<generate-strong-secret>
ANTHROPIC_API_KEY=<your-anthropic-key>
CLIENT_URL=https://your-app.vercel.app  # Update after Vercel deploy
ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Generate secrets:**
```bash
# Run locally to generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 1.5 Run Database Migrations
After first deploy:
```bash
# Option A: Railway CLI
railway run npm run migrate

# Option B: Add to build command (risky - only for initial setup)
# Build: npm install && npm run migrate && npm run build

# Option C: Use Railway "Run Command" in dashboard
# Go to service → Settings → "Run a command": npm run migrate
```

### 1.6 Seed Database (Optional)
```bash
railway run npm run seed
```

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Import Project
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 2.2 Set Environment Variables
```
VITE_API_URL=https://your-backend.railway.app
```

**Find your Railway backend URL:**
- Railway dashboard → Backend service → Settings → Domains
- Copy the public domain (e.g., `datewise-backend-production.up.railway.app`)

### 2.3 Deploy
Click "Deploy" - Vercel will build and deploy automatically.

### 2.4 Update Backend CORS
After Vercel deployment, update Railway environment variables:
```
CLIENT_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Redeploy backend on Railway.

---

## Step 3: Verify Deployment

### 3.1 Backend Health Check
```bash
curl https://your-backend.railway.app/api/health
```

### 3.2 Database Connection
Check Railway logs for database connection success.

### 3.3 Frontend
1. Open https://your-app.vercel.app
2. Test user registration
3. Check browser console for API errors

---

## Alternative Deployment Options

### Option 2: All-in-One on Render

**Backend + Database:**
1. Create Web Service from GitHub
2. Add PostgreSQL database (free tier)
3. Set environment variables
4. Deploy

**Frontend:**
1. Create Static Site
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Root directory: `frontend`

### Option 3: Supabase Database + Railway Backend + Vercel Frontend

**Supabase (Database):**
1. Create project at https://supabase.com
2. Get connection string from Settings → Database
3. Use as `DATABASE_URL` in Railway

**Benefits:** 500MB free PostgreSQL, real-time features, built-in auth

---

## Environment Variables Reference

### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Server
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-frontend-url.vercel.app

# CORS
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app

# Optional: File Uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional: Email
SENDGRID_API_KEY=
FROM_EMAIL=noreply@datewise.app
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend-url.railway.app
```

---

## Post-Deployment Checklist

- [ ] Backend health endpoint accessible
- [ ] Database migrations run successfully
- [ ] Database seeded with activities
- [ ] Frontend loads and connects to backend
- [ ] User registration works
- [ ] Authentication flow works
- [ ] CORS configured correctly
- [ ] Environment variables secured
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS enabled (auto on Railway/Vercel)
- [ ] Error monitoring setup (optional: Sentry)

---

## Cost Estimates

### Free Tier Setup
- **Railway:** $5/month credit (backend + PostgreSQL)
- **Vercel:** Free (frontend, unlimited bandwidth)
- **Total:** Free for first month, ~$5/month after

### Paid Production Setup
- **Railway:** ~$10-20/month (backend + database with no sleep)
- **Vercel:** Free (Pro at $20/month if needed)
- **Total:** ~$10-40/month depending on traffic

---

## Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify DATABASE_URL is set
- Ensure migrations ran successfully

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify VITE_API_URL is correct
- Check Network tab in browser DevTools

### Database connection fails
- Verify PostgreSQL service is running
- Check DATABASE_URL format
- Ensure IP allowlist includes Railway IPs (usually not needed)

### AI recommendations fail
- Verify ANTHROPIC_API_KEY is set
- Check API key has credits
- Review backend logs for API errors

---

## Monitoring & Logs

### Railway
- Dashboard → Service → Logs (real-time)
- Metrics tab for CPU/memory usage

### Vercel
- Dashboard → Project → Deployments → Function logs
- Analytics tab for performance metrics

---

## Custom Domains (Optional)

### Railway (Backend)
1. Service → Settings → Domains
2. Add custom domain
3. Update DNS with provided CNAME

### Vercel (Frontend)
1. Project → Settings → Domains
2. Add domain
3. Configure DNS (automatic if bought through Vercel)

---

## Security Recommendations

1. **Secrets:** Never commit `.env` files
2. **JWT Secret:** Use strong random strings (64+ characters)
3. **Database:** Enable connection pooling (Railway handles this)
4. **Rate Limiting:** Already configured in backend
5. **HTTPS:** Enforced by Railway/Vercel
6. **CORS:** Restrict to your frontend domain only
7. **API Keys:** Rotate periodically
8. **Backups:** Enable on Railway/Render (paid plans)

---

## Continuous Deployment

Both Railway and Vercel auto-deploy on git push:

```bash
git add .
git commit -m "Update feature"
git push origin main

# Railway and Vercel automatically rebuild and deploy
```

Configure branch deployments:
- **main** → Production
- **staging** → Preview deployments

---

## Scaling Considerations

### When to scale:
- Backend: CPU > 70% consistently
- Database: Connection pool exhausted
- Response times > 1 second

### How to scale:
**Railway:**
- Upgrade plan for more resources
- Enable horizontal scaling (Pro plan)
- Add Redis for session storage

**Database:**
- Upgrade to larger instance
- Enable connection pooling
- Add read replicas (advanced)

---

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Supabase Docs:** https://supabase.com/docs
