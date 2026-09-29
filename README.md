# AIP Recipe Helper 🍲

A little public website: someone pastes a link to any recipe, and it hands back
an **Autoimmune-Protocol-compliant** version — swapping out the ingredients that
aren't AIP-friendly for wholesome alternatives that keep the dish delicious.

It's written in a kind, encouraging voice (think Martha Stewart meets Ms. Rachel).

---

## How it works (the short version)

1. The visitor pastes a recipe URL.
2. A small server function opens that page and pulls out the recipe.
3. It sends the recipe to Claude along with your AIP "avoid" and "include" food
   lists, and asks for tasty, compliant swaps.
4. The adapted recipe comes back and is shown on the page.

You don't need to touch any code to run it. You just need two free-to-start
accounts: **Anthropic** (for the AI that does the swapping) and **Vercel** (which
puts the site online). Below is every step.

---

## What you'll need

- An **Anthropic API key** — this is what powers the ingredient swapping.
- A **Vercel account** — free "Hobby" tier is plenty to start.
- A **GitHub account** (easiest path) *or* the Vercel desktop/CLI tool.

Budget note: Anthropic charges per recipe converted (typically a fraction of a
cent to a few cents each). You add a small amount of credit and set a spending
cap so there are no surprises. Vercel's free tier covers the hosting.

---

## Step 1 — Get your Anthropic API key

1. Go to **https://console.anthropic.com** and sign up or log in.
2. Add a little credit under **Billing** (even $5 goes a long way).
3. Open **API Keys → Create Key**, name it "AIP Recipe Helper," and **copy the
   key** somewhere safe. You'll paste it into Vercel in Step 3.
   (It starts with `sk-ant-…`. Treat it like a password — never put it on the
   public page or in the code.)

---

## Step 2 — Put these files on the web with Vercel

**Easiest path (via GitHub):**

1. Create a free account at **https://github.com** and at
   **https://vercel.com** (you can sign into Vercel *with* your GitHub account).
2. Make a new GitHub repository and upload the contents of this folder
   (`index.html`, the `api` folder, `package.json`, `vercel.json`, this README).
   GitHub's website has an "upload files" button if you'd rather not use tools.
3. In Vercel, click **Add New → Project**, pick that repository, and press
   **Deploy**. Vercel figures out the rest automatically.

**No-GitHub path:** install the Vercel CLI (`npm i -g vercel`), open this folder
in a terminal, run `vercel`, and follow the prompts.

---

## Step 3 — Add your secret key to Vercel

This is the one step that makes the swapping actually work.

1. In your Vercel project, go to **Settings → Environment Variables**.
2. Add a variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** the `sk-ant-…` key you copied in Step 1.
3. Save, then go to **Deployments → … → Redeploy** so the key takes effect.

That's it — your site is live at the `https://your-project.vercel.app` address
Vercel shows you. Paste a recipe link and try it!

---

## Making it yours

- **The food lists and swap style** live near the top of `api/convert.js`
  (the `AVOID`, `INCLUDE`, and `SWAP_HINTS` sections). Edit those to fine-tune
  which foods are flagged or how substitutions are chosen.
- **The wording, colors, and headline** live in `index.html`.
- **A custom domain** (like `aiprecipes.com`) can be attached free in Vercel
  under **Settings → Domains**.

## If something isn't working

- **"The converter isn't configured yet…"** → the `ANTHROPIC_API_KEY` isn't set,
  or you didn't redeploy after adding it (Step 3).
- **"…API key was rejected. (Error 401)"** → the key in Vercel isn't valid. It
  must be an Anthropic key (`sk-ant-…`) added under Vercel **Settings →
  Environment Variables** (not a GitHub secret) for **Production**, with no
  quotes or spaces, followed by a **Redeploy**.
- **"…needs to add credit…"** → add credit under **Billing** at
  https://console.anthropic.com.
- **"model not found" in the logs** → open `api/convert.js` and update the
  `MODEL` value near the top to a current model ID from
  https://docs.claude.com/en/docs/about-claude/models
- **A specific recipe won't load** → some sites block automated visits, and some
  don't publish their recipe in a readable form. Most popular recipe blogs work
  well; a few won't.

---

*This tool offers general recipe inspiration and ingredient swaps, not medical
or nutritional advice. Always check ingredient labels against your own needs.*
