You are Claude Code, an expert full-stack TypeScript engineer with deep experience in Stripe Billing (including usage-based billing and billing credits), and in building AI “credit wallet” systems on top of LLM APIs (specifically Google Gemini).

I’m building an AI app that uses a **credit / token model**:

- Users get a **free initial bundle of tokens** when they sign up.
- When their tokens run low, they can **buy more tokens** via Stripe.
- Every time they call our Gemini-powered features, we **deduct tokens** based on model usage.
- We want to price those tokens so that, *after* paying Gemini’s API costs, we make about **40–50% profit margin**.

We want you to write production-grade code (TypeScript) to implement this for us.

We are using **Gemini 3.0 Pro (gemini-3-pro-preview)** with this pricing:

- **Developer / Business API Pricing (pay-as-you-go, per 1M tokens)**  

  **Context length ≤ 200,000 tokens**  
  - Input: **$2.00 per 1M tokens**  
  - Output: **$12.00 per 1M tokens**

  **Context length > 200,000 tokens**  
  - Input: **$4.00 per 1M tokens**  
  - Output: **$18.00 per 1M tokens**

- These prices are for **text generation**; multimodal features (image input/output) have different rates and can be ignored in the first version.

Please reflect this exact, tiered pricing in the cost calculation logic.

---

## High-level goals

1. Implement a **Stripe-powered credit system** that:
   - Lets us sell “token packs” (prepaid credits).
   - Records successful payments via Stripe webhooks.
   - On successful payment, **increments the user’s token balance** in our database.
   - Optionally uses Stripe **Billing Credits / credit-based pricing model** internally (if helpful) – but the main source of truth for usable tokens should still be our own DB.

2. Implement a **Gemini usage + token debit pipeline** that:
   - For each Gemini call, tracks how many tokens were used (input + output).
   - Translates that usage into a **deduction from the user’s token balance**.
   - Uses the **Gemini 3.0 Pro pricing above** and a configurable **markup (40–50%)** to determine:
     - Our internal cost per user token.
     - The price of token packs (in USD) that we charge via Stripe.

3. Implement **API endpoints and core logic** to:
   - Return the user’s current credit balance.
   - Create Stripe Checkout Sessions for purchasing token packs.
   - Handle Stripe webhooks safely & idempotently.
   - Guard the Gemini endpoints so that users can’t call Gemini when they don’t have enough tokens.

You can assume we're using **Firebase App Hosting** with **Cloud Functions for Firebase**, **TypeScript**, **Firestore** for the database, **Firebase Authentication**, and **Stripe Node SDK**.

---

## Stripe + billing model requirements

Please base your implementation on Stripe’s official patterns for **usage-based / credit-based billing** and **billing credits** (credit packs and prepaid balances). Specifically, align with Stripe’s docs on:

- Usage-based billing and metered billing
- Credits-based pricing model & billing credits (prepaid credits applied against usage)

However, for this first version, it’s acceptable if **our own DB is the main source of truth for remaining tokens**, and Stripe is primarily handling **payments & receipts**, not usage metering.

### Stripe configuration we want

Please implement code and/or clear examples for the following:

1. **Products & prices for token packs** (one-time payments), e.g.:
   - “Starter Pack” – 5,000 tokens.
   - “Pro Pack” – 25,000 tokens.
   - “Enterprise Pack” – 100,000 tokens.

   Each pack should have:
   - A Stripe `Product`.
   - A Stripe `Price` (one-time) that we can dynamically compute or configure based on our margin logic.

2. **Price calculation with markup, using Gemini 3.0 Pro pricing**

   We want a **40–50% profit margin after paying Gemini**.  
   Please:

   - Assume we have a configuration object like:

     ```ts
     const GEMINI_PRICING = {
       "gemini-3-pro-preview": {
         tiers: [
           {
             // Context length up to 200,000 tokens
             maxContextTokens: 200_000,
             inputPer1M: 2.0,   // USD per 1M input tokens
             outputPer1M: 12.0, // USD per 1M output tokens
           },
           {
             // Context length > 200,000 tokens
             maxContextTokens: null, // or undefined to mean "no upper bound"
             inputPer1M: 4.0,   // USD per 1M input tokens
             outputPer1M: 18.0, // USD per 1M output tokens
           },
         ],
       },
     };

     const DEFAULT_MARGIN = 0.45; // 45% markup target
     ```

   - Implement a helper to pick the correct tier based on **context length** (total tokens in prompt + expected output), e.g.:

     ```ts
     function getGeminiTierPricing(
       modelKey: string,
       contextTokens: number
     ) {
       const config = GEMINI_PRICING[modelKey];
       if (!config) throw new Error(`Unknown modelKey: ${modelKey}`);

       const tier =
         config.tiers.find(t => t.maxContextTokens === null || contextTokens <= t.maxContextTokens) ??
         config.tiers[config.tiers.length - 1];

       return tier; // { inputPer1M, outputPer1M, maxContextTokens }
     }
     ```

   - Implement a function to compute a **blended cost per 1K user tokens** based on that tier pricing:

     ```ts
     function computeUserPricePer1KTokens(
       modelKey: string,
       margin: number = DEFAULT_MARGIN,
       options?: { contextTokensEstimate?: number }
     ): number {
       const contextTokens = options?.contextTokensEstimate ?? 50_000; // sensible default
       const tier = getGeminiTierPricing(modelKey, contextTokens);

       // Convert per-1M prices to per-1K prices
       const inputPer1K = tier.inputPer1M / 1000;   // USD per 1K input tokens
       const outputPer1K = tier.outputPer1M / 1000; // USD per 1K output tokens

       // We need a blended cost per 1K user tokens; for v1 you can assume
       // roughly 50/50 split of input and output usage:
       const blendedCostPer1K = (inputPer1K + outputPer1K) / 2;

       // Apply margin: userPrice = cost * (1 + margin)
       const userPricePer1K = blendedCostPer1K * (1 + margin);

       return userPricePer1K;
     }
     ```

   - Show how we’d use that to compute the **USD price of a token pack**, e.g.:

     ```ts
     function computePackPriceUSD(
       modelKey: string,
       tokensInPack: number,
       margin: number = DEFAULT_MARGIN,
       options?: { contextTokensEstimate?: number }
     ): number {
       const pricePer1K = computeUserPricePer1KTokens(
         modelKey,
         margin,
         options
       );

       return (tokensInPack / 1000) * pricePer1K;
     }
     ```

   - It’s fine if this is an approximation (using a blended rate and a context length estimate), as long as:
     - The per-1M prices and tiers are **correctly implemented**, and
     - The margin logic is explicit and configurable via `DEFAULT_MARGIN`.

3. **Stripe Checkout Session creation**:

   - Implement a Firebase Cloud Function (e.g., `createTokenCheckout`) that:
     - Accepts `packId` (e.g., “starter”, “pro”, “enterprise”).
     - Looks up pack metadata (tokens, Stripe price ID, etc.).
     - Optionally recomputes the price dynamically using the functions above.
     - Creates a Stripe **Checkout Session** in “payment” mode.
     - Ensures the Checkout Session is associated with the authenticated user (via `customer` / `client_reference_id` / `metadata.userId`).
     - Returns the `url` or `id` of the Checkout Session.

4. **Stripe Webhook handling**:

   - Implement a secured Firebase Cloud Function (e.g., `stripeWebhook`) as an HTTP function.
   - Properly verify Stripe signatures using `stripe.webhooks.constructEvent`.
   - Handle at least:
     - `checkout.session.completed`
     - Optionally `payment_intent.succeeded` if needed
   - On a completed payment:
     - Extract the user identifier from `metadata` / `client_reference_id`.
     - Determine which pack was bought and how many tokens it should grant.
     - Update the user’s **token balance** in our DB (increment).
     - Insert a **credit transaction record** (see DB schema below).
   - Implement **idempotency**:
     - Ensure that if Stripe retries the webhook, we don’t double-add tokens.
     - Use a unique constraint on a `stripeEventId` or `paymentIntentId` in the transaction table.

---

## Data & schema design (Firestore)

Design Firestore collections with the following structure:

1. **Users Collection** (`users/{userId}`)

   ```typescript
   interface User {
     id: string;                    // Firebase Auth UID
     email: string;
     createdAt: Timestamp;
     updatedAt: Timestamp;
     stripeCustomerId?: string;
     tokenBalance: number;          // remaining tokens for AI usage (default: 0)
   }
   ```

2. **Credit Transactions Subcollection** (`users/{userId}/creditTransactions/{transactionId}`)

   ```typescript
   type CreditTransactionType =
     | 'INITIAL_GRANT'
     | 'PURCHASE_TOP_UP'
     | 'USAGE_DEBIT'
     | 'MANUAL_ADJUSTMENT';

   interface CreditTransaction {
     id: string;
     userId: string;
     type: CreditTransactionType;
     tokens: number;                // positive for grants/topups, negative for usage debits
     description?: string;
     stripePaymentIntentId?: string;
     stripeEventId?: string;
     createdAt: Timestamp;
   }
   ```

3. **Gemini Usage Logs Subcollection** (`users/{userId}/geminiUsageLogs/{logId}`)

   ```typescript
   interface GeminiUsageLog {
     id: string;
     userId: string;
     modelKey: string;              // e.g., "gemini-3-pro-preview"
     inputTokens: number;
     outputTokens: number;
     costUSD: number;               // our raw Gemini cost for this call (before margin)
     debitedTokens: number;         // how many tokens we deducted from user
     requestId?: string;            // internal trace ID
     createdAt: Timestamp;
   }
   ```

4. **Token Packs Collection** (`tokenPacks/{packId}`) - optional, can be config in code

   ```typescript
   interface TokenPack {
     id: string;                    // e.g., "starter", "pro", "enterprise"
     name: string;
     tokens: number;
     stripePriceId: string;
     modelKey: string;              // which Gemini cost basis this pack assumes
     createdAt: Timestamp;
     updatedAt: Timestamp;
   }
   ```

5. **Processed Events Collection** (`processedStripeEvents/{eventId}`) - for idempotency

   ```typescript
   interface ProcessedStripeEvent {
     eventId: string;               // Stripe event ID
     processedAt: Timestamp;
     eventType: string;
   }
   ```

If you prefer, you can keep TokenPack purely as a TypeScript config instead of a Firestore collection. Either approach is fine; pick one and implement it cleanly.

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Subcollections
      match /creditTransactions/{transactionId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if false; // Only Cloud Functions can write
      }

      match /geminiUsageLogs/{logId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if false; // Only Cloud Functions can write
      }
    }

    // Token packs are readable by all authenticated users
    match /tokenPacks/{packId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only via Cloud Functions
    }

    // Processed events - only Cloud Functions
    match /processedStripeEvents/{eventId} {
      allow read, write: if false;
    }
  }
}
```

⸻

Initial signup credits

We want new users to receive some free initial tokens (e.g., 2,000 tokens).

Please:
	1.	Add a configuration constant:

const INITIAL_SIGNUP_TOKENS = 2000;


	2.	In our user creation flow (you can stub this), ensure:
	•	When a user is created, we:
	•	Set user.tokenBalance = INITIAL_SIGNUP_TOKENS.
	•	Insert a CreditTransaction of type INITIAL_GRANT with tokens = INITIAL_SIGNUP_TOKENS.
	3.	Make sure this logic is idempotent if the signup endpoint is retried for the same email (or show best practice).

⸻

Gemini usage & token debit logic (with the new pricing)

We’re already using Gemini behind the scenes. You can assume we have (or will implement) a helper like:

type GeminiCallParams = {
  userId: string;
  modelKey: string; // e.g., "gemini-3-pro-preview"
  prompt: string;
  // plus any other fields like system messages, etc.
};

type GeminiCallResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
};

Please implement:
	1.	A function:

async function callGeminiWithCredits(
  params: GeminiCallParams
): Promise<GeminiCallResult> {
  // 1) Load user & check credits
  // 2) Estimate or reserve tokens if needed
  // 3) Call Gemini API
  // 4) Compute actual token usage and raw Gemini cost using tiered 3.0 Pro pricing
  // 5) Compute tokens to deduct from user
  // 6) Deduct tokens atomically from DB (with transaction)
  // 7) Insert GeminiUsageLog and CreditTransaction (USAGE_DEBIT)
  // 8) Return result
}


	2.	Cost & debit formulas using the tiered pricing:
	•	Use the context length to select the correct tier and compute Gemini raw cost:

function computeGeminiCostUSD(
  modelKey: string,
  inputTokens: number,
  outputTokens: number
): number {
  const contextTokens = inputTokens + outputTokens;
  const tier = getGeminiTierPricing(modelKey, contextTokens);

  // Per-1M to actual USD cost
  const inputCost =
    (inputTokens / 1_000_000) * tier.inputPer1M;
  const outputCost =
    (outputTokens / 1_000_000) * tier.outputPer1M;

  return inputCost + outputCost;
}


	•	Convert Gemini cost into user tokens. Assume we have a blended user price per 1K tokens for this model:

function convertCostToUserTokens(
  modelKey: string,
  costUSD: number,
  margin: number = DEFAULT_MARGIN,
  options?: { contextTokensEstimate?: number }
): number {
  const userPricePer1K = computeUserPricePer1KTokens(
    modelKey,
    margin,
    options
  );

  // tokens = (cost / pricePer1K) * 1000
  const rawTokens = (costUSD / userPricePer1K) * 1000;

  // Round up to ensure we never lose money on a call
  return Math.ceil(rawTokens);
}


	•	Ensure that the markup margin (40–50%) is preserved on average by using the DEFAULT_MARGIN and by rounding token debits up.

	3.	Atomic balance update:
	•	Use a Firestore transaction to:
	•	Check that user.tokenBalance >= debitedTokens.
	•	Subtract debitedTokens.
	•	Insert GeminiUsageLog with costUSD and debitedTokens.
	•	Insert CreditTransaction of type USAGE_DEBIT.
	•	If balance is insufficient, throw an error and do not call Gemini (or return an error that the frontend can interpret as "please top up").
	4.	Add a Firebase Cloud Function (e.g., `geminiChat`) that:
	•	Requires an authenticated user via Firebase Auth.
	•	Accepts prompt (and optional modelKey, default "gemini-3-pro-preview").
	•	Calls callGeminiWithCredits.
	•	Returns the AI response text + current remaining tokenBalance.

⸻

## Firebase Cloud Functions to implement

Please write complete example code (with types) for the following Firebase Cloud Functions:

1. **`getCredits`** (Callable Function)
   - Requires authenticated user
   - Returns:
   ```json
   {
     "tokenBalance": number,
     "transactions": [ ...recent credit transactions... ]
   }
   ```

2. **`createTokenCheckout`** (Callable Function)
   - Requires authenticated user
   - Body: `{ "packId": string }`
   - Logic:
     - Validates packId.
     - Loads pack config (tokens, stripePriceId, etc.).
     - Computes or validates price using computePackPriceUSD with the Gemini 3.0 Pro pricing.
     - Creates Stripe Checkout Session.
   - Returns:
   ```json
   { "checkoutUrl": string }
   ```

3. **`stripeWebhook`** (HTTP Function)
   - Handles checkout completion & token grants.
   - Uses signature verification.
   - Is idempotent (checks `processedStripeEvents` collection).

4. **`geminiChat`** (Callable Function)
   - Requires authenticated user
   - Body: `{ "prompt": string, "modelKey"?: string }`
   - Uses callGeminiWithCredits.
   - Responds with `{ "text": string, "tokenBalance": number }`.

5. **`onUserCreate`** (Auth Trigger Function)
   - Triggered when a new user signs up via Firebase Auth
   - Creates user document in Firestore with initial token balance
   - Inserts INITIAL_GRANT credit transaction

Please include necessary TS types, imports, and any environment variable usage. Use Firebase Functions config or environment variables for secrets:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_API_KEY` (for Gemini)

⸻

## Non-functional requirements

- Use TypeScript everywhere with clear types.
- Handle all operations that mutate credit balances inside **Firestore transactions** to avoid race conditions.
- Implement basic error handling and return clear error messages for:
  - Insufficient credits.
  - Stripe errors.
  - Webhook signature verification failures.
  - Unauthenticated requests.
- Keep the code well-structured and modular (helpers for pricing, Stripe, Gemini calls, Firestore access).

⸻

## Output format

Please output:

1. **Firestore type definitions** (`types.ts`)

2. **The core helper modules:**
   - `pricing.ts` (tiered Gemini 3.0 Pro pricing, markup logic + cost calculation)
   - `credits.ts` (helpers to grant and debit tokens using Firestore)
   - `gemini.ts` or `ai.ts` (wrapping Gemini API with credits handling)
   - `stripe.ts` (Stripe client + Checkout creation helpers)

3. **Firebase Cloud Functions:**
   - `functions/src/index.ts` (main exports)
   - `functions/src/getCredits.ts`
   - `functions/src/createTokenCheckout.ts`
   - `functions/src/stripeWebhook.ts`
   - `functions/src/geminiChat.ts`
   - `functions/src/onUserCreate.ts`

4. **Firestore security rules** (`firestore.rules`)

5. **Frontend integration examples** for calling the Cloud Functions from React

⸻

## Firebase Project Structure

```
functions/
├── src/
│   ├── index.ts              # Main exports for all Cloud Functions
│   ├── types.ts              # Firestore document types
│   ├── config.ts             # Configuration constants
│   ├── lib/
│   │   ├── pricing.ts        # Gemini pricing & markup logic
│   │   ├── credits.ts        # Token grant/debit helpers
│   │   ├── gemini.ts         # Gemini API wrapper
│   │   └── stripe.ts         # Stripe client & helpers
│   ├── getCredits.ts         # Callable: get user credits
│   ├── createTokenCheckout.ts # Callable: create Stripe checkout
│   ├── stripeWebhook.ts      # HTTP: handle Stripe webhooks
│   ├── geminiChat.ts         # Callable: AI chat with credits
│   └── onUserCreate.ts       # Auth trigger: initialize new users
├── package.json
└── tsconfig.json
firestore.rules
firestore.indexes.json
```

If you need to make reasonable assumptions, do so, but keep the code cohesive and production-oriented.
