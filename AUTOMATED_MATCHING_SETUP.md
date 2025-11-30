# Automated Daily Match Generation Setup

## 🎯 How It Works on Render Free Tier

Since Render's free tier **sleeps after 15 minutes of inactivity**, we use a combination of strategies:

1. **External Free Cron Service** - Wakes up backend and triggers match generation daily
2. **Lazy Generation** - Generates matches when users log in (fallback)
3. **API Endpoint** - Secured endpoint for triggering match generation

This approach works perfectly with free tier limitations and costs **$0**!

---

## 🚀 Setup Guide

### Step 1: Generate Cron Secret (2 min)

```bash
# Generate a secure cron secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Save this output** - you'll need it for Step 2 and Step 3.

---

### Step 2: Add Environment Variable to Render (2 min)

1. Go to your **backend service** on Render
2. Navigate to **Environment** tab
3. Click **Add Environment Variable**
4. Add:
   ```
   Key: CRON_SECRET
   Value: <paste your generated secret from Step 1>
   ```
5. Click **Save Changes**
6. Wait for backend to redeploy (~2-3 min)

---

### Step 3: Set Up Free External Cron Service (5 min)

We'll use **cron-job.org** (free, reliable, no signup needed for basic use).

#### Option A: cron-job.org (Recommended)

1. Go to https://cron-job.org/en/
2. Click **"Sign up for free"** or use without account
3. Create a new cron job:

**Configuration:**
```
Title: DateWise Daily Match Generation
URL: https://your-backend.onrender.com/api/cron/generate-matches
Method: POST
Headers:
  - Key: X-Cron-Secret
  - Value: <your-cron-secret-from-step-1>

Schedule: Daily at 00:00 (midnight)
Timezone: Asia/Singapore (or your timezone)

Notifications: Enable email on failure (optional)
```

4. Click **Create**
5. Test it immediately: Click **"Run check"**
6. Should see **Success 200** response

#### Option B: EasyCron (Alternative)

1. Go to https://www.easycron.com/
2. Sign up for free (up to 1 cron job free)
3. Create new cron job:

```
URL: https://your-backend.onrender.com/api/cron/generate-matches
Cron Expression: 0 0 * * * (midnight daily)
Method: POST
Custom Headers: X-Cron-Secret: <your-secret>
```

#### Option C: GitHub Actions (Free for public repos)

Create `.github/workflows/daily-matches.yml`:

```yaml
name: Generate Daily Matches

on:
  schedule:
    # Runs at 00:00 UTC daily
    - cron: '0 0 * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  generate-matches:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Match Generation
        run: |
          curl -X POST \
            -H "X-Cron-Secret: ${{ secrets.CRON_SECRET }}" \
            https://your-backend.onrender.com/api/cron/generate-matches
```

Add `CRON_SECRET` to GitHub repo secrets:
- Go to repo Settings → Secrets and variables → Actions
- New repository secret: `CRON_SECRET`

---

## 📊 How the Automation Works

### Daily Generation Process

```
Midnight (or your scheduled time)
  ↓
External Cron Service triggers:
POST /api/cron/generate-matches
  ↓
Backend wakes up (if sleeping)
  ↓
Match Generator runs:
  1. Finds all active users without today's matches
  2. For each user:
     - Find top 3 compatible users (shared activities + age match)
     - Create matches with AI-generated insights
     - Adds 1-second delay between users (avoid API rate limits)
  ↓
Returns results:
{
  "usersProcessed": 25,
  "matchesCreated": 75,
  "errors": []
}
  ↓
Users see new matches when they log in! 🎉
```

---

## 🛡️ Security Features

### Endpoint Protection

The `/api/cron/generate-matches` endpoint is protected by:

1. **Secret Token Authentication**
   - Must provide correct `CRON_SECRET` in header or query
   - Without it: `401 Unauthorized`

2. **Duplicate Prevention**
   - Tracks created pairs to avoid duplicates
   - Users only get matches once per day

3. **Rate Limiting**
   - 1-second delay between users
   - Prevents AI API rate limiting
   - Reduces server load

---

## 🧪 Testing the Setup

### Manual Test via cURL

```bash
# Replace with your actual values
curl -X POST \
  -H "X-Cron-Secret: your-cron-secret-here" \
  https://your-backend.onrender.com/api/cron/generate-matches

# Expected response:
{
  "success": true,
  "data": {
    "usersProcessed": 10,
    "matchesCreated": 30,
    "errors": []
  },
  "message": "Generated 30 matches for 10 users"
}
```

### Check Generation Stats

```bash
curl -H "X-Cron-Secret: your-secret" \
  https://your-backend.onrender.com/api/cron/stats

# Response:
{
  "success": true,
  "data": {
    "todayMatches": 75,
    "usersWithMatches": 25,
    "averageMatchesPerUser": 3,
    "pendingUsers": 5
  }
}
```

---

## 📅 Recommended Schedule

### For MVP/Testing
```
Frequency: Daily at midnight
Users: <100
Cost: Free
Cron Service: cron-job.org
```

### For Growing App
```
Frequency: Daily at 00:00 and 12:00
Users: 100-1000
Cost: Free or upgrade backend to $7/month
Cron Service: cron-job.org or EasyCron
```

### For Production
```
Frequency: Multiple times daily
Users: 1000+
Cost: Upgrade to paid tier (~$30/month total)
Cron Service: Built-in or GitHub Actions
Alternative: Move to Railway/AWS with native cron
```

---

## 🔄 Lazy Generation (Backup Strategy)

As a fallback, you can also generate matches when users log in:

**Future Enhancement** (optional):
```javascript
// In authController.ts login function
async login(req, res) {
  // ... existing login code ...

  // After successful login, generate matches if needed
  await DailyMatchGenerator.generateMatchesForUser(user.id);

  // ... return response ...
}
```

This ensures users **always** have matches even if cron fails.

---

## 🐛 Troubleshooting

### Issue: Cron job shows "Failed" or "Timeout"

**Cause:** Backend is sleeping (cold start takes 30-40s on free tier)

**Solution:**
1. In cron-job.org, increase timeout to **60 seconds**
2. Add a "health check" cron 5 minutes before:
   ```
   GET https://your-backend.onrender.com/api/health
   Schedule: Daily at 23:55
   ```
   This wakes up backend before main cron runs.

### Issue: No matches being created

**Check:**
1. Backend logs for errors
2. Cron secret is correct
3. Users have `profile_completed = true`
4. Users have selected activities

**Debug:**
```bash
# Check stats
curl -H "X-Cron-Secret: SECRET" \
  https://backend.onrender.com/api/cron/stats

# If pendingUsers > 0, manually trigger:
curl -X POST -H "X-Cron-Secret: SECRET" \
  https://backend.onrender.com/api/cron/generate-matches
```

### Issue: "Too many API requests" error

**Cause:** AI API rate limiting

**Solution:**
Increase delay in `dailyMatchGenerator.ts`:
```javascript
await this.sleep(2000); // Change from 1000 to 2000ms
```

### Issue: Backend crashes during generation

**Cause:** Memory limit on free tier

**Solution:**
1. Process users in smaller batches
2. Upgrade to paid tier ($7/month)

---

## 💰 Cost Analysis

### Free Tier Setup (Current)

**Infrastructure:**
- Render Backend: Free (with 15min sleep)
- Render Database: Free (256MB PostgreSQL)
- External Cron: Free (cron-job.org or GitHub Actions)
- **Total: $0/month** ✅

**Anthropic AI API:**
- Match generation: ~$0.01-0.05 per match
- 100 users × 3 matches/day = 300 matches/day
- Cost: ~$3-15/month
- **With free $5 credit: First month free!**

**Total Monthly Cost:** $3-15 (just for AI)

### Upgraded Setup (Better Performance)

**Infrastructure:**
- Render Backend Starter: $7/month (always-on)
- Render Database: Free
- Cron: Built-in or free external
- **Total: $7/month**

**AI:** Same as above ($3-15/month)

**Total Monthly Cost:** $10-22/month

---

## 📈 Scaling Considerations

### When to upgrade from free tier:

**Backend:**
- [ ] 100+ active daily users
- [ ] Match generation takes >5 minutes
- [ ] Cold start frustrates cron service

**Database:**
- [ ] Approaching 256MB storage
- [ ] Need automated backups
- [ ] >1000 users

**AI:**
- [ ] Want better/faster models
- [ ] Need higher rate limits
- [ ] Generating 1000+ matches/day

---

## ✅ Deployment Checklist

Before going live:

- [ ] Generated `CRON_SECRET` and saved it
- [ ] Added `CRON_SECRET` to Render environment variables
- [ ] Set up external cron service (cron-job.org)
- [ ] Tested cron endpoint manually with cURL
- [ ] Verified cron job runs successfully
- [ ] Confirmed matches appear in user dashboard
- [ ] Set up email notifications for cron failures (optional)
- [ ] Documented cron credentials in password manager

---

## 🎉 Success Indicators

Your automated matching is working when:

- ✅ Cron job shows "Success 200" status
- ✅ Backend logs show "🎯 Starting daily match generation..."
- ✅ Stats endpoint shows `todayMatches > 0`
- ✅ Users see new matches in their dashboard daily
- ✅ No errors in cron job history
- ✅ Backend wakes up successfully for cron
- ✅ AI API usage within budget

---

## 🔧 Advanced: Multiple Match Generations Per Day

For active apps, generate matches twice daily:

**Morning batch** (8 AM):
```
Cron: 0 8 * * *
Purpose: Fresh matches for morning browsers
```

**Evening batch** (6 PM):
```
Cron: 0 18 * * *
Purpose: Fresh matches for evening users
```

**Setup:**
Create two separate cron jobs in cron-job.org with different schedules but same endpoint.

---

## 📞 Getting Help

**Cron not triggering?**
1. Check Render backend logs for requests
2. Verify cron secret matches exactly
3. Test endpoint manually with cURL

**No matches created?**
1. Check `/api/cron/stats` for `pendingUsers`
2. Verify users have completed profiles
3. Check backend logs for errors

**AI errors?**
1. Verify `ANTHROPIC_API_KEY` is set
2. Check API credits at console.anthropic.com
3. Review rate limits in Anthropic dashboard

---

## 🎯 Next Steps

1. **Set up cron** following Step 3 above
2. **Test manually** to verify it works
3. **Monitor** first few days to ensure stability
4. **Adjust** timing based on user activity patterns
5. **Scale** as your user base grows

---

**Ready to automate? Start with Step 1 above!** 🚀

Total setup time: ~15 minutes
Monthly cost: $0 (infrastructure) + ~$3-15 (AI)
Maintenance: Zero (fully automated)
