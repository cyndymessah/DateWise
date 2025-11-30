# Render Deployment Checklist for DateWise

## ✅ Deployment Checklist

Use this to track your Render deployment progress:

### Pre-Deployment
- [ ] Generate JWT_SECRET (64+ characters random)
- [ ] Generate SESSION_SECRET (64+ characters random)
- [ ] Get Anthropic API key from console.anthropic.com
- [ ] Create Render account and link GitHub

### Database Setup
- [ ] Create PostgreSQL database on Render
- [ ] Name: `datewise-db`
- [ ] Plan: Free
- [ ] Region: Singapore
- [ ] Copy Internal Database URL

### Backend Deployment
- [ ] Create Web Service for backend
- [ ] Root directory: `backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Add all environment variables:
  - [ ] NODE_ENV=production
  - [ ] PORT=3001
  - [ ] DATABASE_URL (from database)
  - [ ] JWT_SECRET (generated)
  - [ ] SESSION_SECRET (generated)
  - [ ] ANTHROPIC_API_KEY (from Anthropic)
  - [ ] CLIENT_URL (placeholder first)
  - [ ] ALLOWED_ORIGINS (placeholder first)
- [ ] Wait for successful deployment
- [ ] Copy backend URL (e.g., https://datewise-backend.onrender.com)

### Database Migration
- [ ] Open backend Shell tab
- [ ] Run: `npm run migrate`
- [ ] Run: `npm run seed`
- [ ] Verify success messages
- [ ] Exit shell

### Frontend Deployment
- [ ] Create Static Site for frontend
- [ ] Root directory: `frontend`
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `dist`
- [ ] Add environment variable:
  - [ ] VITE_API_URL (backend URL + /api)
- [ ] Wait for successful deployment
- [ ] Copy frontend URL (e.g., https://datewise-frontend.onrender.com)

### CORS Configuration
- [ ] Go back to backend service → Environment
- [ ] Update CLIENT_URL with frontend URL
- [ ] Update ALLOWED_ORIGINS with frontend URL
- [ ] Save and wait for redeploy

### Testing
- [ ] Visit frontend URL
- [ ] Wait for backend cold start (30-40s first time)
- [ ] Test user registration
- [ ] Test login
- [ ] Test profile update
- [ ] Test activity selection
- [ ] Check browser console for errors
- [ ] Verify backend health: https://your-backend.onrender.com/api/health

### Post-Deployment
- [ ] Bookmark your app URLs
- [ ] Set up custom domain (optional)
- [ ] Test automatic deployments (git push)
- [ ] Share with beta users!

---

## 🔗 Your Deployment URLs

Fill these in as you deploy:

```
Database (Internal):
postgresql://datewise:______________@___________/datewise

Backend Service:
https://_______________________.onrender.com

Frontend Site:
https://_______________________.onrender.com

Health Check:
https://_______________________.onrender.com/api/health
```

---

## 🚨 Common Issues & Fixes

### Issue: "Network Error" on frontend

**Solution:**
1. Check VITE_API_URL in frontend environment variables
2. Must be: `https://your-backend.onrender.com/api` (with /api!)
3. Redeploy frontend if you change it

### Issue: CORS Error

**Solution:**
1. Backend environment must have:
   - CLIENT_URL = https://your-frontend.onrender.com
   - ALLOWED_ORIGINS = https://your-frontend.onrender.com
2. URLs must match exactly (no trailing slash)
3. Backend auto-redeploys when you save

### Issue: Backend won't start

**Check logs for:**
- Missing DATABASE_URL
- Missing JWT_SECRET or SESSION_SECRET
- Wrong DATABASE_URL format

**Fix:** Add missing variables in Environment tab

### Issue: "Internal Server Error" on login/register

**Likely cause:** Database not migrated

**Solution:**
1. Go to backend Shell
2. Run: `npm run migrate && npm run seed`
3. Refresh your app

### Issue: Activities not showing

**Likely cause:** Database not seeded

**Solution:**
1. Go to backend Shell
2. Run: `npm run seed`
3. Should see "Seeded X activities"

### Issue: Backend very slow (30s+ wait)

**Explanation:** Free tier sleeps after 15 min inactivity

**Solutions:**
- Accept it for dev/testing (it's free!)
- Upgrade to paid plan ($7/month for always-on)
- Use during active development hours

### Issue: "Too many connections" database error

**Likely cause:** Connection pool not closing

**Temporary fix:**
1. Go to database settings
2. "Suspend" then "Resume"
3. Clears stuck connections

**Long-term:** Upgrade database plan if this happens often

---

## 📝 Environment Variables Reference

### Backend (.env)

**Required:**
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host/dbname
JWT_SECRET=<64+ random characters>
SESSION_SECRET=<64+ random characters>
ANTHROPIC_API_KEY=sk-ant-...
CLIENT_URL=https://your-frontend.onrender.com
ALLOWED_ORIGINS=https://your-frontend.onrender.com
```

**Optional (for future):**
```bash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SENDGRID_API_KEY=
FROM_EMAIL=noreply@datewise.app
```

### Frontend (.env)

**Required:**
```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

**Note:** Don't forget the `/api` at the end!

---

## 🔄 Redeployment Guide

### To redeploy backend:
1. Go to backend service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Or: Push to GitHub (auto-deploys)

### To redeploy frontend:
1. Go to frontend site
2. Click "Manual Deploy" → "Deploy latest commit"
3. Or: Push to GitHub (auto-deploys)

### To restart backend (without rebuild):
1. Go to backend service
2. Click "Manual Deploy" → "Restart service"
3. Useful for picking up env variable changes

---

## 💡 Pro Tips

1. **Bookmark your services:**
   - Add dashboard.render.com to favorites
   - Pin your 3 services (DB, backend, frontend)

2. **Monitor logs:**
   - Keep Logs tab open during first deployment
   - Helps catch issues immediately

3. **Test locally first:**
   ```bash
   cd /home/user/DateWise
   npm run dev
   # Test everything works before deploying
   ```

4. **Use branch deploys for testing:**
   - Create service from a dev branch
   - Test changes before merging to main
   - Free tier allows multiple services!

5. **Keep DATABASE_URL secret:**
   - Never commit it to git
   - Never share it publicly
   - Render's internal URL is already protected

6. **Wake up before showing:**
   - Visit your app 1 minute before demoing
   - Avoids cold start embarrassment
   - Or upgrade to paid for always-on

7. **Check health endpoint:**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
   Quick way to wake up backend + verify it's working

---

## 📈 Monitoring & Maintenance

### Weekly:
- [ ] Check error logs in backend
- [ ] Review database usage (free tier: 256MB max)
- [ ] Test core user flows

### Monthly:
- [ ] Review Render usage dashboard
- [ ] Check if approaching free tier limits
- [ ] Test automatic deployments still work

### When you get users:
- [ ] Set up error monitoring (Sentry)
- [ ] Add analytics (Mixpanel, PostHog)
- [ ] Consider upgrading to paid tier
- [ ] Enable database backups (paid feature)

---

## 🚀 Upgrade Path

### When to upgrade from free tier:

**Backend → Starter ($7/month):**
- When: Users complain about cold starts
- Benefit: Always-on, faster, no sleep
- Worth it: When you have 10+ active users

**Database → Standard ($25/month):**
- When: Approaching 256MB storage
- When: Need automated backups
- Benefit: 10GB storage, daily backups
- Worth it: When app is making money

**Frontend:**
- Usually free tier is enough forever
- Paid plans add team features, not performance

### Alternative: Migrate to Railway/Vercel
- Once you're paying anyway
- Railway: Better DX, faster deploys
- Vercel: Better frontend performance
- Cost: Similar (~$25-30/month total)

---

## 🆘 Getting Help

**Render Support:**
- Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

**DateWise Issues:**
- Check backend logs first
- Check browser console
- Review this checklist

**Can't figure it out?**
1. Copy error message from logs
2. Check what step failed
3. Review environment variables
4. Try redeploying
5. Check Render status page (might be platform issue)

---

## ✨ Success Criteria

Your deployment is successful when:

- ✅ Backend health check returns {"status":"ok"}
- ✅ Frontend loads without errors
- ✅ Can create a new account
- ✅ Can log in with created account
- ✅ Can update profile information
- ✅ Can select activities from the list
- ✅ No CORS errors in browser console
- ✅ No errors in backend logs
- ✅ git push automatically triggers redeployment

**If all above work: Congratulations! 🎉 Your app is live!**

---

## 📞 Quick Commands

```bash
# Generate secrets locally
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Test backend health (replace URL)
curl https://datewise-backend.onrender.com/api/health

# Test from local machine
cd /home/user/DateWise
npm run dev

# Check backend logs (in Render Shell)
pm2 logs

# Manually run migrations (in Render Shell)
npm run migrate && npm run seed
```

---

## 🎯 You're Ready!

Follow the checklist above step by step. Take your time with each step.

**Estimated total time:** 20-30 minutes

**Most time-consuming parts:**
- First backend build: ~5-8 minutes
- Frontend build: ~3-5 minutes
- Waiting for redeployments: ~2-3 minutes each

**Least time-consuming:**
- Everything else is just clicking and pasting!

Good luck! 🚀
