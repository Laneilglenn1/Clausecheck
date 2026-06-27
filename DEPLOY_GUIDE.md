# 🚀 How to Put ClauseCheck Online — Step by Step

**Written for someone who has never deployed a website. No coding required.**
Total time: about 30–45 minutes. Total cost to start: ~$0 (you only pay pennies per contract analyzed).

---

## What you're about to do

You'll take this folder of code and put it on the internet so anyone can visit it at a real web address. You'll use 3 free tools:

1. **GitHub** — stores your code (free)
2. **Vercel** — runs your website (free)
3. **Anthropic** — the AI brain that analyzes contracts (pay-as-you-go, ~$0.01–0.03 per analysis)

---

## STEP 1 — Get your AI key (10 min)

1. Go to **console.anthropic.com** and sign up
2. Click **Settings → Billing** and add a payment method. Add $5 to start — that's hundreds of contract analyses.
3. Click **API Keys → Create Key**
4. Copy the key (it starts with `sk-ant-...`) and paste it somewhere safe for now. **Treat this like a password. Never share it.**

---

## STEP 2 — Put the code on GitHub (10 min)

1. Go to **github.com** and sign up (free)
2. Click the **+** in the top right → **New repository**
3. Name it `clausecheck`, leave it Public or Private, click **Create repository**
4. On the next page click **"uploading an existing file"**
5. Drag in **everything inside this folder** (the `src` folder, the `api` folder, `package.json`, `index.html`, `vite.config.js`, `.gitignore`)
6. Click **Commit changes**

> 💡 Tip: Do NOT upload your API key. It's never in these files on purpose — you'll add it to Vercel privately in Step 3.

---

## STEP 3 — Launch it on Vercel (10 min)

1. Go to **vercel.com** and click **Sign Up** → choose **"Continue with GitHub"**
2. Click **Add New → Project**
3. Find your `clausecheck` repository and click **Import**
4. Before clicking Deploy, expand **Environment Variables** and add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** paste your `sk-ant-...` key here
   - Click **Add**
5. Click **Deploy**
6. Wait ~1 minute. You'll get a live link like `clausecheck.vercel.app` 🎉

**Your website is now live.** Open the link on your phone and test it.

---

## STEP 4 — Add it to your phone home screen (2 min)

1. Open your Vercel link in Safari (iPhone) or Chrome (Android)
2. Tap the **Share** button → **Add to Home Screen**
3. Now ClauseCheck has an icon on your phone like a real app. Tap it anytime.

---

## STEP 5 (Optional) — Use your own domain (15 min, ~$12/yr)

1. Buy a domain at **namecheap.com** or **cloudflare.com** (e.g. `clausecheck.com`)
2. In Vercel, go to your project → **Settings → Domains**
3. Type your domain, click **Add**, and follow the instructions it gives you
4. Done — your site now lives at your own address

---

## Common problems

**"Error: API key not configured"**
→ You forgot Step 3.4, or typed the variable name wrong. It must be exactly `ANTHROPIC_API_KEY`. Fix it in Vercel → Settings → Environment Variables, then redeploy.

**The page loads but analysis fails**
→ Check your Anthropic billing has credit (Step 1.2).

**I changed code — how do I update the live site?**
→ Re-upload the changed file to GitHub. Vercel auto-updates within a minute.

---

## What it costs to run

- GitHub: free
- Vercel: free (until you get serious traffic)
- Anthropic: ~$0.01–0.03 per contract analyzed. 1,000 analyses ≈ $10–30.

You can set a monthly spending cap in the Anthropic console so you never get surprised.

---

## Next steps once it's live

1. Share the link with 10 people who sign contracts
2. Watch what they do and ask if they'd pay
3. When people say yes, add Stripe to charge them (ask me to build that part)

You've got this. 🚀
