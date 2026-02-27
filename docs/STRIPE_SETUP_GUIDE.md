# Stripe Setup Guide — GreenLine365

> Step-by-step guide to connect Stripe so customers can pay for Pro ($45/mo) and Premium ($89/mo) subscriptions.

---

## What You Need Before Starting

- A computer with a web browser
- Access to your email (the one you want to use for the business)
- Your bank account info (for receiving payouts)
- Access to your Vercel dashboard (where GreenLine365 is deployed)

---

## Part 1: Create Your Stripe Account

### Step 1 — Go to Stripe

1. Open your browser
2. Go to **https://dashboard.stripe.com/register**
3. Fill in:
   - **Email** — your business email
   - **Full name** — your legal name
   - **Country** — United States
   - **Password** — something strong
4. Click **Create account**
5. Verify your email (check your inbox, click the link Stripe sends you)

### Step 2 — Activate Your Account (So You Can Accept Real Money)

After signing up, Stripe will ask you to "activate" your account. This is required to accept real payments.

1. From the Stripe dashboard, click the banner that says **"Activate your account"** (or go to **Settings > Account details**)
2. Fill out the form. It will ask for:
   - **Business type**: Select "Individual / Sole proprietor" (unless you have an LLC/Corp)
   - **Legal business name**: "GreenLine365" or your registered name
   - **Business address**: Your real address
   - **Industry**: "Software" or "Internet services"
   - **Website**: Your GreenLine365 URL (e.g., `https://greenline365.com`)
   - **Product description**: "Monthly subscription for business directory listings"
   - **Bank account**: Your routing number + account number for payouts
   - **Tax ID (EIN or SSN)**: Required for US tax reporting
3. Click **Submit**
4. Stripe may take 1-2 days to verify, but you can continue setup immediately

> **Important:** Until you activate, Stripe will be in "test mode" and won't process real money. That's actually fine for setting up — you can test everything first.

---

## Part 2: Create Your Two Products

Your code needs two products in Stripe: **Pro** and **Premium**. Here's exactly how to create them.

### Step 3 — Create the Pro Product ($45/month)

1. In the Stripe dashboard, click **Product catalog** in the left sidebar (or go to **https://dashboard.stripe.com/products**)
2. Click the **+ Add product** button (top right)
3. Fill in:
   - **Name**: `GL365 Pro`
   - **Description**: `Verified badge, CTA buttons, priority ranking, unlimited photos, marketplace add-on access`
   - (Skip the image — optional)
4. Under **Pricing**:
   - **Model**: Select **Standard pricing**
   - **Price**: `45.00`
   - **Currency**: USD
   - **Billing period**: Select **Recurring**, then **Monthly**
5. Click **Save product**

### Step 4 — Copy the Pro Price ID

After saving, you'll be on the product detail page.

1. Scroll down to the **Pricing** section
2. You'll see your price listed: `$45.00 / month`
3. Click on that price row
4. Look for the **Price ID** — it starts with `price_` followed by a long string
   - Example: `price_1ABC123def456ghi789`
5. **Copy this entire ID**. Write it down or paste it in a note. This is your `STRIPE_PRO_PRICE_ID`.

> **How to find it if you can't see it:** Click the price row, then look in the right-side panel or URL. The ID always starts with `price_`.

### Step 5 — Create the Premium Product ($89/month)

1. Go back to **Product catalog** (click it in the left sidebar)
2. Click **+ Add product** again
3. Fill in:
   - **Name**: `GL365 Premium`
   - **Description**: `Google photos synced, featured homepage placement, badge earning, analytics dashboard, lead capture forms, priority support`
4. Under **Pricing**:
   - **Model**: **Standard pricing**
   - **Price**: `89.00`
   - **Currency**: USD
   - **Billing period**: **Recurring** > **Monthly**
5. Click **Save product**

### Step 6 — Copy the Premium Price ID

1. Same as Step 4 — scroll to Pricing section
2. Click the price row for `$89.00 / month`
3. Copy the **Price ID** (starts with `price_`)
4. Write it down. This is your `STRIPE_PREMIUM_PRICE_ID`.

---

## Part 3: Get Your API Keys

### Step 7 — Find Your Secret Key

1. In the Stripe dashboard, click **Developers** in the left sidebar (bottom area)
2. Click **API keys**
3. You'll see two keys:
   - **Publishable key** — starts with `pk_live_` (you don't need this one right now)
   - **Secret key** — starts with `sk_live_` (this is the important one)
4. Click **Reveal live key** next to the Secret key
5. **Copy the entire key**. This is your `STRIPE_SECRET_KEY`.

> **Warning:** This key can charge real money. Never share it, never put it in code, never post it anywhere. It only goes in environment variables.

> **Test mode vs Live mode:** At the top right of the Stripe dashboard, there's a toggle that says "Test mode". When it's ON, your keys start with `sk_test_` and no real money moves. When it's OFF, keys start with `sk_live_` and it's real. **Set up everything in test mode first**, then switch to live when you're ready.

---

## Part 4: Set Up the Webhook (So Stripe Talks to Your App)

When a customer pays, Stripe needs to tell your app "hey, this person paid." That's what webhooks do.

### Step 8 — Create the Webhook Endpoint

1. In the Stripe dashboard, click **Developers** > **Webhooks**
2. Click **+ Add endpoint**
3. Fill in:
   - **Endpoint URL**: `https://YOUR-DOMAIN.com/api/stripe/webhook`
     - Replace `YOUR-DOMAIN.com` with your actual domain
     - Example: `https://greenline365.com/api/stripe/webhook`
     - If using Vercel preview: `https://greenline365-web.vercel.app/api/stripe/webhook`
   - **Description** (optional): `GreenLine365 subscription events`
4. Under **Select events to listen to**, click **+ Select events**
5. Search for and check these **7 events** (check the box next to each one):

   | Event | What It Does |
   |-------|-------------|
   | `checkout.session.completed` | Customer finished paying |
   | `customer.subscription.updated` | Subscription tier changed |
   | `customer.subscription.deleted` | Subscription was cancelled |
   | `customer.subscription.paused` | Subscription was paused |
   | `customer.subscription.resumed` | Subscription was resumed |
   | `invoice.payment_succeeded` | Monthly payment went through |
   | `invoice.payment_failed` | Monthly payment failed (card declined, etc.) |

6. Click **Add events** to confirm
7. Click **Add endpoint** to save

### Step 9 — Copy the Webhook Signing Secret

After creating the endpoint:

1. Click on the webhook endpoint you just created
2. Under **Signing secret**, click **Reveal**
3. Copy the secret — it starts with `whsec_`
4. This is your `STRIPE_WEBHOOK_SECRET`

> **This is critical.** Without this secret, your app will reject every webhook from Stripe and subscriptions won't activate after payment.

---

## Part 5: Set Up the Customer Portal

The Customer Portal lets your subscribers manage their own subscription (cancel, upgrade, update payment method) without you doing anything.

### Step 10 — Configure the Customer Portal

1. In the Stripe dashboard, go to **Settings** > **Billing** > **Customer portal** (or search "Customer portal" in the top search bar)
2. Under **Functionality**, turn ON:
   - **Allow customers to update their payment methods** — YES
   - **Allow customers to view their invoices** — YES
   - **Allow customers to cancel subscriptions** — YES (set to "Cancel immediately" or "At end of billing period" — recommended: at end of billing period)
   - **Allow customers to switch plans** — YES
3. Under **Products**, add your two products:
   - Click **+ Add product**
   - Select **GL365 Pro** ($45/month)
   - Click **+ Add product** again
   - Select **GL365 Premium** ($89/month)
4. Under **Business information**:
   - **Headline**: `Manage your GreenLine365 subscription`
   - **Privacy policy**: your privacy policy URL (e.g., `https://greenline365.com/privacy`)
   - **Terms of service**: your terms URL (e.g., `https://greenline365.com/terms`)
5. Click **Save**

> You don't need a separate API key or env var for this. The portal uses your existing `STRIPE_SECRET_KEY`.

---

## Part 6: Add Everything to Vercel

Now you have 5 values. Time to put them where your app can use them.

### Step 11 — Add Environment Variables in Vercel

1. Go to **https://vercel.com/dashboard**
2. Click on your **greenline365-web** project
3. Click **Settings** (top nav)
4. Click **Environment Variables** (left sidebar)
5. Add each of these one by one:

| Key | Value | Example |
|-----|-------|---------|
| `STRIPE_SECRET_KEY` | Your secret key from Step 7 | `sk_live_abc123...` |
| `STRIPE_PRO_PRICE_ID` | Pro price ID from Step 4 | `price_1ABC123...` |
| `STRIPE_PREMIUM_PRICE_ID` | Premium price ID from Step 6 | `price_1DEF456...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret from Step 9 | `whsec_abc123...` |
| `STRIPE_PUBLISHABLE_KEY` | Publishable key from Step 7 | `pk_live_abc123...` |

**For each variable:**
1. Type the **Key** name exactly as shown (copy-paste it)
2. Paste your **Value**
3. Under **Environment**, check all three: **Production**, **Preview**, **Development**
4. Click **Save**

> **Test mode tip:** If you want to test first, use your test-mode keys (`sk_test_...`, `price_test_...`, `whsec_test_...`). Create the products in test mode (toggle "Test mode" ON in Stripe dashboard), then repeat the product creation steps. When ready for real money, switch to live keys.

### Step 12 — Redeploy

After adding all env vars:

1. Still in Vercel, click **Deployments** (top nav)
2. Find your latest deployment
3. Click the **...** menu (three dots) on the right
4. Click **Redeploy**
5. Wait for it to finish (usually 1-2 minutes)

> Environment variables only take effect after a new deployment. If you skip this step, your old deployment will still have empty values.

---

## Part 7: Test the Whole Thing

### Step 13 — Test in Stripe Test Mode

1. In Stripe dashboard, toggle **Test mode** ON (top right)
2. Repeat Steps 3-6 to create test products (or use your existing test products)
3. Repeat Step 7 to get test API keys (`sk_test_...`)
4. Repeat Steps 8-9 to create a test webhook pointing to your preview/staging URL
5. Put the test keys in Vercel (for Preview environment only)

### Step 14 — Do a Test Purchase

1. Go to your site's `/pricing` page
2. Click **Get Started** on Pro ($45)
3. Register a business (use a test email)
4. You'll be redirected to Stripe Checkout
5. Use this **test credit card**:
   - **Card number**: `4242 4242 4242 4242`
   - **Expiration**: Any future date (e.g., `12/30`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)
6. Click **Subscribe**
7. You should land on the success page: `/register-business/success?payment=success&tier=pro`

### Step 15 — Verify It Worked

Check these three places:

**In Stripe:**
1. Go to **Payments** in the sidebar — you should see a $45 payment
2. Go to **Customers** — you should see a new customer with the test email
3. Go to **Subscriptions** — you should see an active Pro subscription

**In Supabase:**
1. Go to your Supabase dashboard > **Table Editor**
2. Check `directory_listings` — the listing should have `tier = 'pro'` and `is_claimed = true`
3. Check `payment_transactions` — should have a row with `status = 'paid'`

**In Stripe Webhooks:**
1. Go to **Developers** > **Webhooks**
2. Click your endpoint
3. Scroll down to **Recent events**
4. You should see `checkout.session.completed` with status **Succeeded** (green)
5. If it says **Failed** (red), click it to see the error message

---

## Part 8: Go Live

### Step 16 — Switch to Live Mode

When you're confident everything works in test mode:

1. Toggle **Test mode** OFF in Stripe dashboard
2. Create your products again in live mode (Steps 3-6) — or if you created them in live mode originally, you already have them
3. Copy your **live** API keys (`sk_live_...`)
4. Update your Vercel environment variables to use the live keys
5. Create a **live** webhook endpoint (same URL, same events)
6. Copy the live webhook signing secret
7. Redeploy on Vercel

> **You now have two sets of everything:** test keys for development/preview, live keys for production. Vercel lets you scope env vars to specific environments (Production vs Preview vs Development) so they don't conflict.

---

## Quick Reference: All Environment Variables

| Variable | Starts With | Where You Get It |
|----------|-------------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_live_` or `sk_test_` | Developers > API keys |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_` or `pk_test_` | Developers > API keys |
| `STRIPE_PRO_PRICE_ID` | `price_` | Product catalog > GL365 Pro > Pricing |
| `STRIPE_PREMIUM_PRICE_ID` | `price_` | Product catalog > GL365 Premium > Pricing |
| `STRIPE_WEBHOOK_SECRET` | `whsec_` | Developers > Webhooks > your endpoint > Signing secret |

---

## Troubleshooting

### "Webhook signature verification failed"
- Your `STRIPE_WEBHOOK_SECRET` is wrong or missing
- Make sure you copied the `whsec_` value from the correct webhook endpoint
- Make sure you redeployed after adding it to Vercel

### Checkout works but tier doesn't update
- Your webhook isn't reaching your app
- Check Stripe > Developers > Webhooks > Recent events for failures
- Make sure the endpoint URL is exactly `https://YOUR-DOMAIN.com/api/stripe/webhook`
- Make sure you selected the `checkout.session.completed` event

### "STRIPE_SECRET_KEY not set"
- The env var isn't in Vercel, or you haven't redeployed
- Go to Vercel > Settings > Environment Variables and confirm it's there
- Redeploy

### Customer pays but subscription shows in wrong tier
- Make sure `STRIPE_PRO_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID` are correct
- Each price ID is unique. Don't mix up Pro and Premium.
- If the env vars are missing, the code creates throwaway prices (works but messy)

### Customer can't manage their subscription
- Make sure you configured the Customer Portal (Step 10)
- Make sure the products are added to the portal configuration
- The customer must have a `stripe_customer_id` in the database
