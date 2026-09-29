// Serverless function: POST { url } -> AIP-converted recipe (JSON)
// Runs on Vercel (Node.js runtime). No external dependencies.

// ---- Model configuration -------------------------------------------------
// If this ever errors with "model not found", update the ID below to a current
// one from https://docs.claude.com/en/docs/about-claude/models
const MODEL = "claude-sonnet-4-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// ---- AIP food lists (from the project's guides) --------------------------
const AVOID = `
GRAINS: barley, bulgur, corn, durum, einkorn, farro, fonio, Job's tears, kamut, millet, oats, rice, rye, semolina, sorghum, spelt, teff, triticale, wheat (all varieties), wild rice.
PSEUDO-GRAINS: amaranth, buckwheat, chia seed, quinoa.
DAIRY: butter, buttermilk, butter oil, cheese, cottage cheese, cream, cream cheese, milk, curds, dairy-protein isolates, ghee, heavy cream, ice cream, kefir, sour cream, whey, whipping cream, yogurt.
NUTS & NUT OILS: almonds, brazil nuts, cashews, chestnuts, hazelnuts, macadamia, pecans, pine nuts, pistachios, walnuts (and any flours, butters, oils, milks from nuts).
SEEDS & SEED OILS: chia, chocolate/cacao/cocoa, coffee, flax, hemp, poppy, pumpkin seeds, sesame, sunflower, tahini (and anything derived from seeds).
LEGUMES: all beans, lentils, peas, peanuts, soybeans, tofu, tempeh, edamame, green beans, chickpeas.
NIGHTSHADES & NIGHTSHADE SPICES: tomatoes, potatoes (white), eggplant, all peppers (bell, chili, cayenne, sweet), paprika, chili powder, pimentos, tomatillos, goji berries, ashwagandha. (Sweet potatoes ARE allowed.)
SEED-BASED SPICES: allspice, anise, annatto, caraway, cumin, black cumin, cardamom, celery seed, coriander (seed), dill seed, fennel seed, fenugreek, juniper, mustard, nutmeg, pepper (black/white), poppy.
EGGS: all eggs (chicken, duck, goose, quail).
PROCESSED VEGETABLE OILS: canola, corn, cottonseed, grapeseed, palm kernel, peanut, rapeseed, safflower, soybean, sunflower.
ADDED SUGARS (refined/processed): cane sugar (white/brown/raw), corn syrup, high-fructose corn syrup, agave, beet sugar, dextrose, fructose, sucrose, powdered sugar, and similar refined sweeteners.
SUGAR ALCOHOLS & ARTIFICIAL SWEETENERS: aspartame, sucralose, saccharin, erythritol, xylitol, sorbitol, stevia, monk fruit.
PROCESSED CHEMICALS: artificial colors/flavors, carrageenan, guar gum, xanthan gum, MSG, emulsifiers, hydrogenated oils, and any unrecognizable chemical additives.
OTHER: alcohol (beer, wine, liquor — though alcohol cooked off in a dish is generally fine), aloe vera, baking powder, chlorella, spirulina, psyllium husk.
`.trim();

const INCLUDE = `
MEAT & POULTRY: beef, bison, lamb, pork, chicken, turkey, duck, goose, venison, goat, rabbit and other pastured/grass-fed meats.
FISH & SEAFOOD: salmon, cod, tuna, sardines, mackerel, trout, shrimp, crab, lobster, scallops, mussels, oysters, clams and other wild-caught fish/shellfish.
VEGETABLES: artichoke, asparagus, broccoli, brussels sprouts, cauliflower, celery, garlic, onion, leek, shallot, green onion, chives, fennel, capers.
LEAFY GREENS: kale, spinach, collards, chard, arugula, romaine, cabbage, bok choy, lettuce, watercress, mustard greens, dandelion greens.
ROOTS & TUBERS: sweet potato (any color), carrots, beets, parsnip, turnip, rutabaga, radish, daikon, ginger, horseradish, cassava, taro, yuca, arrowroot, tigernuts, celeriac, jicama, kohlrabi, water chestnuts.
SQUASHES: butternut, acorn, spaghetti squash, zucchini, summer squash, pumpkin, delicata.
MUSHROOMS: button, cremini, portobello, shiitake, oyster, chanterelle, porcini.
SEA VEGETABLES: nori, kombu, wakame, dulse, kelp, arame.
FRUITS: apple, pear, banana, plantain, avocado, coconut, berries (blueberry, strawberry, raspberry, blackberry, cranberry, cherry), citrus (lemon, lime, orange, grapefruit), mango, peach, pineapple, melon, grapes, dates, figs, olives, pomegranate.
HEALTHY FATS: avocado oil, coconut oil, olive oil, palm oil/shortening, lard, tallow, bacon fat, poultry fat (schmaltz), duck fat.
FLOURS: cassava flour, coconut flour, arrowroot starch, tapioca starch, tigernut flour, plantain/green-banana flour, sweet potato flour, water chestnut flour.
LEAF & ROOT SPICES (safe): basil, bay leaf, cilantro, cinnamon, cloves, dill weed, garlic, ginger, lemongrass, mace, marjoram, onion powder, oregano, parsley, mint, rosemary, saffron, sage, thyme, turmeric, chamomile, chives, cloves, kaffir lime leaf, lavender, salt, sea salt.
OTHER STAPLES: coconut aminos (soy-sauce replacement), coconut milk, coconut butter, coconut yogurt, fish sauce, apple cider vinegar, balsamic/red-wine/white-wine vinegar, coconut vinegar, gelatin, nutritional yeast, capers, olives, anchovy paste, cream of tartar, baking soda.
SWEETENERS (in moderation): honey, maple syrup, maple sugar, coconut sugar, coconut syrup, molasses.
`.trim();

// ---- Handy, taste-preserving swap cues -----------------------------------
const SWAP_HINTS = `
- Soy sauce / tamari  ->  coconut aminos (a touch less salty, slightly sweeter; add a pinch of salt).
- Wheat / all-purpose flour  ->  cassava flour (closest 1:1 for many recipes) or a blend with arrowroot/tapioca for lightness.
- Cornstarch / flour thickener  ->  arrowroot starch or tapioca starch.
- Butter  ->  coconut oil, olive oil, or lard/tallow depending on the dish (use quality fat that suits the flavor).
- Milk / cream  ->  full-fat coconut milk.
- Cheese richness  ->  nutritional yeast for savory depth (use sparingly).
- Eggs (as binder)  ->  gelatin egg, mashed banana, or applesauce depending on role.
- Rice  ->  cauliflower rice.
- Pasta / noodles  ->  spiralized zucchini, spaghetti squash, or sweet potato noodles.
- Potatoes  ->  sweet potato, taro, or cauliflower.
- Tomato / tomato sauce / paste  ->  "AIP nomato" made from cooked carrot + beet + broth, seasoned with herbs, or a pumpkin/butternut base.
- Black pepper  ->  a little more fresh herb, or a small amount of horseradish/ginger for warmth.
- Chili / paprika / cayenne heat  ->  ginger, horseradish, or a pinch of cinnamon-warmth blend; for color use turmeric or beet powder.
- Cumin / coriander / curry blends  ->  turmeric, ginger, cinnamon, mace, and other AIP-safe warming spices.
- Peanut / nut butters  ->  coconut butter or tigernut butter.
- Refined sugar  ->  honey or maple syrup, used in moderation.
- Vegetable/canola/seed oils  ->  avocado oil, olive oil, or coconut oil.
`.trim();

const SYSTEM_PROMPT = `You are a warm, encouraging recipe helper who adapts recipes to be compliant with the Autoimmune Protocol (AIP). Your voice is kind and gently cheerful, like Martha Stewart crossed with Ms. Rachel — reassuring, never clinical.

Your job: take the recipe the user provides and rewrite it so that EVERY ingredient on the AIP "avoid" list is replaced with a suitable alternative from the AIP "include" list, chosen so the finished dish still tastes wonderful. Keep everything that is already AIP-compliant exactly as it is.

AIP FOODS TO AVOID:
${AVOID}

AIP FOODS TO INCLUDE (use these as replacements):
${INCLUDE}

TASTE-PRESERVING SWAP IDEAS:
${SWAP_HINTS}

RULES:
- Replace every avoid-list ingredient. If something has no good substitute, choose the closest compliant option and briefly say so in its swap note rather than dropping it silently.
- Adjust quantities and cooking steps when a swap needs it (e.g. coconut flour absorbs more liquid than wheat flour) so the recipe actually works.
- Keep spices flavorful using only AIP-safe herbs and roots. Do not leave a dish bland.
- Never invent that a food is compliant when it is not. Sweeteners like honey and maple are allowed only in moderation.
- If the provided text does not actually contain a recipe (no ingredients/steps), set an error message instead of guessing.

OUTPUT FORMAT: Respond with ONLY a single valid JSON object, no markdown fences, matching exactly:
{
  "title": "string — the dish name, you may prefix with 'AIP '",
  "summary": "1-2 warm sentences introducing the adapted dish",
  "swaps": [ { "avoid": "original ingredient", "include": "AIP replacement", "why": "short friendly reason it keeps the dish tasty" } ],
  "ingredients": [ "full AIP-compliant ingredient line with quantity", ... ],
  "instructions": [ "step 1", "step 2", ... ],
  "cooksNote": "one kind, encouraging closing tip",
  "error": null
}
If there is no usable recipe, return the same object shape with a helpful "error" string and empty arrays.`;

// ---- Recipe extraction ---------------------------------------------------
function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

// Try to pull a schema.org Recipe object out of JSON-LD blocks.
function extractJsonLdRecipe(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    let parsed;
    try { parsed = JSON.parse(b[1].trim()); } catch { continue; }
    const candidates = [];
    const collect = (o) => {
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) return o.forEach(collect);
      if (o["@graph"]) collect(o["@graph"]);
      const t = o["@type"];
      const isRecipe = t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"));
      if (isRecipe) candidates.push(o);
    };
    collect(parsed);
    if (candidates.length) {
      const r = candidates[0];
      const steps = [];
      const pushInstr = (ins) => {
        if (!ins) return;
        if (typeof ins === "string") return ins.split(/\n+/).forEach(s => s.trim() && steps.push(s.trim()));
        if (Array.isArray(ins)) return ins.forEach(pushInstr);
        if (ins.text) steps.push(String(ins.text).trim());
        if (ins.itemListElement) pushInstr(ins.itemListElement);
      };
      pushInstr(r.recipeInstructions);
      const ings = Array.isArray(r.recipeIngredient) ? r.recipeIngredient
                 : Array.isArray(r.ingredients) ? r.ingredients : [];
      const name = typeof r.name === "string" ? r.name : "";
      if (ings.length) {
        return {
          name: decodeEntities(name),
          ingredients: ings.map(x => decodeEntities(String(x).trim())),
          instructions: steps.map(decodeEntities)
        };
      }
    }
  }
  return null;
}

// Fallback: strip the page down to readable text.
function extractReadableText(html) {
  let t = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  t = decodeEntities(t).replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
  return t.slice(0, 12000); // keep the request lean
}

async function fetchRecipeSource(url) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AIP-Recipe-Helper/1.0; +https://vercel.app)",
      "Accept": "text/html,application/xhtml+xml"
    },
    redirect: "follow"
  });
  if (!resp.ok) throw new Error("PAGE_" + resp.status);
  const html = await resp.text();
  const ld = extractJsonLdRecipe(html);
  if (ld && ld.ingredients.length) {
    return "RECIPE TITLE: " + ld.name + "\n\nINGREDIENTS:\n" +
      ld.ingredients.join("\n") + "\n\nINSTRUCTIONS:\n" +
      (ld.instructions.length ? ld.instructions.map((s, i) => (i + 1) + ". " + s).join("\n") : "(not provided)");
  }
  return "PAGE TEXT (extract the recipe from this):\n\n" + extractReadableText(html);
}

// Turn an Anthropic API error into a message that points at the actual fix.
// Setup problems (key, billing, model) are the site owner's to fix, so say so.
function friendlyApiError(status, apiMsg) {
  if (status === 401) {
    return "The converter isn't set up correctly yet — the site owner's Anthropic API key was rejected. (Error 401)";
  }
  if (status === 400 && /credit balance/i.test(apiMsg)) {
    return "The converter is temporarily unavailable — the site owner needs to add credit to their Anthropic account. (Error 400)";
  }
  if (status === 403) {
    return "The converter isn't set up correctly yet — the site owner's Anthropic API key doesn't have permission for this. (Error 403)";
  }
  if (status === 404) {
    return "The converter isn't set up correctly yet — the AI model it uses wasn't found. (Error 404)";
  }
  if (status === 429 || status === 529 || status >= 500) {
    return "The converter is very busy right now. Please try again in a minute. (Error " + status + ")";
  }
  return "The converter had trouble just now. Please try again in a moment. (Error " + status + ")";
}

// ---- Handler -------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  // trim guards against a stray space/newline pasted into the Vercel setting
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    res.status(500).json({ error: "The converter isn't configured yet — the site owner needs to add an ANTHROPIC_API_KEY." });
    return;
  }

  let url;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    url = (body && body.url || "").trim();
  } catch { /* ignore */ }

  if (!/^https?:\/\/.+/i.test(url || "")) {
    res.status(400).json({ error: "Please paste a valid recipe link starting with http:// or https://." });
    return;
  }

  let source;
  try {
    source = await fetchRecipeSource(url);
  } catch (e) {
    const msg = String(e.message || "");
    if (msg.startsWith("PAGE_")) {
      res.status(200).json({ error: "I couldn't open that page (the site returned an error). Try a different link." });
    } else {
      res.status(200).json({ error: "I couldn't reach that recipe. Please check the link and try again." });
    }
    return;
  }

  try {
    const anthRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: "Here is the recipe to adapt to AIP:\n\n" + source }]
      })
    });

    if (!anthRes.ok) {
      const detail = await anthRes.text();
      // Log as one plain string so Vercel shows the full message, not "{…}"
      console.error("Anthropic error " + anthRes.status + ": " + detail);
      let apiMsg = "";
      try { apiMsg = String(JSON.parse(detail).error.message || ""); } catch { /* not JSON */ }
      res.status(200).json({ error: friendlyApiError(anthRes.status, apiMsg) });
      return;
    }

    const data = await anthRes.json();
    let text = (data.content || []).map(c => c.text || "").join("").trim();
    // strip accidental code fences
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let recipe;
    try {
      recipe = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) { try { recipe = JSON.parse(m[0]); } catch {} }
    }
    if (!recipe) {
      res.status(200).json({ error: "I adapted the recipe but had trouble formatting it. Please try again." });
      return;
    }
    res.status(200).json(recipe);
  } catch (e) {
    console.error(e);
    res.status(200).json({ error: "Something unexpected happened while converting. Please try again." });
  }
}
