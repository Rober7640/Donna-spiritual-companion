# Payment Provider Configuration

Benedara supports both **Stripe** and **PayPal** for credit purchases. You can easily switch between providers by changing a single environment variable.

---

## 🎯 Quick Start

### Current Provider
Set in `.env`:
```bash
PAYMENT_PROVIDER=stripe  # or "paypal"
```

**That's it!** Change this variable to switch payment providers.

---

## 💳 Stripe Setup

### 1. Get API Keys

1. Go to https://dashboard.stripe.com/
2. Navigate to **Developers → API keys**
3. Copy your **Secret key**

### 2. Create Products

1. Go to **Products** in Stripe Dashboard
2. Create two products:
   - **Starter Package** - $14.99 for 30 minutes
   - **Faithful Package** - $39.99 for 90 minutes
3. Copy the **Price ID** for each (starts with `price_`)

### 3. Configure Webhook

1. Go to **Developers → Webhooks**
2. Add endpoint: `https://yourdomain.com/api/v1/credits/webhook`
3. Select event: `checkout.session.completed`
4. Copy the **Webhook signing secret**

### 4. Environment Variables

Add to `.env`:
```bash
PAYMENT_PROVIDER=stripe

STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_FAITHFUL_PRICE_ID=price_xxxxxxxxxxxxx
```

### 5. Test Mode

- Use **test mode** keys (start with `sk_test_`) for development
- Use **live mode** keys (start with `sk_live_`) for production
- Stripe automatically handles test vs. live mode based on the key

---

## 🅿️ PayPal Setup

### 1. Create PayPal App

1. Go to https://developer.paypal.com/dashboard/
2. Click **Apps & Credentials**
3. Create a new app (or use an existing one)
4. Copy **Client ID** and **Secret**

### 2. Environment Variables

Add to `.env`:
```bash
PAYMENT_PROVIDER=paypal

PAYPAL_CLIENT_ID=xxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxx
PAYPAL_MODE=sandbox  # Use "live" for production
```

### 3. Sandbox vs Live

**Sandbox (Testing):**
- Use sandbox credentials from developer dashboard
- Set `PAYPAL_MODE=sandbox`
- Test with sandbox buyer accounts

**Live (Production):**
- Use live credentials from developer dashboard
- Set `PAYPAL_MODE=live`
- Real payments with real money

### 4. Optional: Webhooks

PayPal webhooks are optional. The current implementation uses the **return URL flow**:
1. User approves payment on PayPal
2. PayPal redirects to `/api/v1/credits/paypal/capture`
3. Server captures the order and adds credits

For additional security, you can set up PayPal webhooks later.

---

## 🔄 Switching Between Providers

### Change Provider

Simply update `.env`:
```bash
# Switch to Stripe
PAYMENT_PROVIDER=stripe

# Switch to PayPal
PAYMENT_PROVIDER=paypal
```

Then restart your server.

### Why You Might Switch

**Use Stripe when:**
- ✅ You want the easiest integration
- ✅ You need subscriptions (coming soon)
- ✅ You want modern payment methods (Apple Pay, Google Pay)
- ✅ You prefer better developer experience and documentation

**Use PayPal when:**
- ✅ Your users are 50+ (higher PayPal trust)
- ✅ You want to avoid monthly fees
- ✅ You want users to pay with PayPal balance (no card needed)
- ✅ Lower transaction fees in some regions

---

## 🛠️ API Endpoints

### Stripe Endpoints

```
POST /api/v1/credits/checkout
- Creates Stripe checkout session
- Returns { checkoutUrl: "https://checkout.stripe.com/..." }

POST /api/v1/credits/webhook
- Stripe webhook handler
- Receives payment completion events
```

### PayPal Endpoints

```
POST /api/v1/credits/paypal/checkout
- Creates PayPal order
- Returns { checkoutUrl: "https://www.paypal.com/checkoutnow?token=..." }

GET /api/v1/credits/paypal/capture
- Captures approved PayPal order
- Called automatically when user returns from PayPal
```

### Universal Endpoints

```
GET /api/v1/credits/balance
- Get current credit balance
- Works with both providers

GET /api/v1/credits/transactions
- Get credit transaction history
- Works with both providers
```

---

## 🧪 Testing

### Test Stripe Payments

Use test card numbers:
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- Any future expiry date, any CVC

Full list: https://stripe.com/docs/testing

### Test PayPal Payments

1. Create sandbox buyer account at https://developer.paypal.com/
2. Or use PayPal's test buyers
3. Complete checkout flow with sandbox account

---

## 💰 Pricing Comparison

| Provider | Transaction Fee | Monthly Fee | Setup |
|----------|----------------|-------------|-------|
| **Stripe** | 2.9% + $0.30 | $0 (free tier) | Easy |
| **PayPal** | 2.9% + $0.30 | $0 | Moderate |

Both have similar fees for standard transactions. Differences:
- **Stripe** has premium features that cost extra (advanced fraud, revenue recognition)
- **PayPal** may have lower fees for high volume (negotiate rates)

---

## 📝 Implementation Details

### How It Works

Both providers follow the same flow:

**1. User clicks "Buy Credits"**
- Frontend calls `/api/v1/credits/checkout` or `/api/v1/credits/paypal/checkout`
- Backend creates checkout session/order
- Returns checkout URL

**2. User redirected to payment provider**
- Stripe: `checkout.stripe.com`
- PayPal: `paypal.com/checkoutnow`

**3. User completes payment**
- Enters card details (Stripe) or logs in (PayPal)
- Approves purchase

**4. Provider confirms payment**
- **Stripe:** Sends webhook to `/api/v1/credits/webhook`
- **PayPal:** User returns to `/api/v1/credits/paypal/capture`

**5. Credits added**
- Backend calls `creditsService.fulfillCredits()`
- Credits added to user account
- User redirected to `/purchase-success`

### Idempotency

Both implementations are **idempotent**:
- Safe to call `fulfillCredits()` multiple times
- Duplicate payments won't create duplicate credits
- Uses payment provider's transaction ID as unique key

---

## 🔐 Security Notes

### Stripe
- ✅ Webhook signature verification (secure)
- ✅ HTTPS required for production
- ✅ PCI compliant (user never enters card on your server)

### PayPal
- ✅ OAuth 2.0 authentication
- ✅ Order capture flow prevents fraud
- ⚠️ Webhook verification not yet implemented (optional)
- ✅ HTTPS required for production

---

## 🐛 Troubleshooting

### "Stripe is not configured"
- Check `STRIPE_SECRET_KEY` is set in `.env`
- Restart server after adding env vars

### "PayPal is not configured"
- Check `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set
- Restart server after adding env vars

### Webhook not working (Stripe)
- Verify webhook secret matches Stripe dashboard
- Check endpoint URL is correct: `https://yourdomain.com/api/v1/credits/webhook`
- Ensure `checkout.session.completed` event is selected
- Test with Stripe CLI: `stripe listen --forward-to localhost:5000/api/v1/credits/webhook`

### PayPal capture fails
- Check `PAYPAL_MODE` matches your credentials (sandbox vs live)
- Verify return URL is accessible: `APP_URL` should be your public domain
- Check PayPal error logs in server console

---

## 📊 Monitoring

### Track Payments

Both providers log to console:
```
✅ Stripe checkout completed: cs_test_xxxxx for user user_123
✅ PayPal order captured: ORDER-xxxxx for user user_123
```

### Database

All purchases are recorded in `credit_transactions` table:
```sql
SELECT * FROM credit_transactions
WHERE type = 'purchase'
ORDER BY created_at DESC;
```

Each transaction stores:
- `user_id` - Who bought credits
- `amount` - Minutes purchased
- `metadata.payment_id` - Stripe session ID or PayPal order ID
- `metadata.package` - "starter" or "faithful"

---

## 🚀 Production Checklist

### Before Going Live

**General:**
- [ ] Set `APP_URL` to production domain
- [ ] Enable HTTPS (required by both providers)
- [ ] Test complete purchase flow

**Stripe:**
- [ ] Switch to **live mode** keys
- [ ] Update webhook URL to production domain
- [ ] Create live products and copy price IDs
- [ ] Test webhook with real purchase

**PayPal:**
- [ ] Switch to **live mode** credentials
- [ ] Set `PAYPAL_MODE=live`
- [ ] Update return URL to production domain
- [ ] Test with small real purchase ($0.01)

---

## 📚 Additional Resources

**Stripe:**
- Dashboard: https://dashboard.stripe.com/
- Docs: https://stripe.com/docs/payments/checkout
- Testing: https://stripe.com/docs/testing

**PayPal:**
- Dashboard: https://developer.paypal.com/dashboard/
- Docs: https://developer.paypal.com/docs/checkout/
- Sandbox: https://www.sandbox.paypal.com/

---

**Last Updated:** 2026-02-09
**Current Implementation:** Both Stripe and PayPal supported
**Default Provider:** Stripe
