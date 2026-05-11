import { createServerFn } from "@tanstack/react-start";
import { sql, nextId } from "./db.server";

// ---------- LOOKUPS ----------
export const getLookups = createServerFn({ method: "GET" }).handler(async () => {
  const [foods, foodGroups, storages, runs, stores, units, recipes, lists] = await Promise.all([
    sql`SELECT food_id, food_name, food_group_id FROM food ORDER BY food_name`,
    sql`SELECT food_group_id, food_group_name FROM food_group ORDER BY food_group_name`,
    sql`SELECT storage_id, location, temperature FROM storage ORDER BY location`,
    sql`SELECT run_id, store_id, bought_date FROM grocery_runs ORDER BY bought_date DESC`,
    sql`SELECT store_id, store_name, address FROM grocery_stores ORDER BY store_name`,
    sql`SELECT unit_id, unit_name, unit_type FROM units ORDER BY unit_name`,
    sql`SELECT recipe_id, recipe_name, servings, instructions FROM recipe ORDER BY recipe_name`,
    sql`SELECT grocery_list_id, list_name FROM grocery_list ORDER BY list_name`,
  ]);
  return { foods, foodGroups, storages, runs, stores, units, recipes, lists };
});

// ---------- INVENTORY ----------
export const getInventory = createServerFn({ method: "GET" }).handler(async () => {
  return await sql`
    SELECT i.inventory_id, i.food_id, f.food_name, fg.food_group_name,
           i.storage_id, s.location AS storage_location,
           i.run_id, gr.bought_date, gs.store_name,
           i.purchase_price, i.expiration_date, i.opened_date,
           i.quantity, i.unit_id, u.unit_name
    FROM inventory i
    LEFT JOIN food f ON f.food_id = i.food_id
    LEFT JOIN food_group fg ON fg.food_group_id = f.food_group_id
    LEFT JOIN storage s ON s.storage_id = i.storage_id
    LEFT JOIN grocery_runs gr ON gr.run_id = i.run_id
    LEFT JOIN grocery_stores gs ON gs.store_id = gr.store_id
    LEFT JOIN units u ON u.unit_id = i.unit_id
    ORDER BY i.expiration_date NULLS LAST, i.inventory_id DESC
  `;
});

export const addInventory = createServerFn({ method: "POST" })
  .inputValidator((d: {
    food_id: number | null; storage_id: number | null; run_id: number | null;
    purchase_price: number | null; expiration_date: string | null; opened_date: string | null;
    quantity: number | null; unit_id: number | null;
  }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("inventory", "inventory_id");
    await sql`INSERT INTO inventory (inventory_id, food_id, storage_id, run_id, purchase_price, expiration_date, opened_date, quantity, unit_id)
      VALUES (${id}, ${data.food_id}, ${data.storage_id}, ${data.run_id}, ${data.purchase_price}, ${data.expiration_date}, ${data.opened_date}, ${data.quantity}, ${data.unit_id})`;
    return { id };
  });

export const updateInventory = createServerFn({ method: "POST" })
  .inputValidator((d: any) => d)
  .handler(async ({ data }) => {
    await sql`UPDATE inventory SET food_id=${data.food_id}, storage_id=${data.storage_id}, run_id=${data.run_id},
      purchase_price=${data.purchase_price}, expiration_date=${data.expiration_date}, opened_date=${data.opened_date},
      quantity=${data.quantity}, unit_id=${data.unit_id} WHERE inventory_id=${data.inventory_id}`;
    return { ok: true };
  });

export const deleteInventory = createServerFn({ method: "POST" })
  .inputValidator((d: { inventory_id: number }) => d)
  .handler(async ({ data }) => { await sql`DELETE FROM inventory WHERE inventory_id=${data.inventory_id}`; return { ok: true }; });

// ---------- FOOD ----------
export const addFood = createServerFn({ method: "POST" })
  .inputValidator((d: { food_name: string; food_group_id: number | null }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("food", "food_id");
    await sql`INSERT INTO food (food_id, food_name, food_group_id) VALUES (${id}, ${data.food_name}, ${data.food_group_id})`;
    return { id };
  });
export const updateFood = createServerFn({ method: "POST" })
  .inputValidator((d: { food_id: number; food_name: string; food_group_id: number | null }) => d)
  .handler(async ({ data }) => { await sql`UPDATE food SET food_name=${data.food_name}, food_group_id=${data.food_group_id} WHERE food_id=${data.food_id}`; return { ok: true }; });
export const deleteFood = createServerFn({ method: "POST" })
  .inputValidator((d: { food_id: number }) => d)
  .handler(async ({ data }) => { await sql`DELETE FROM food WHERE food_id=${data.food_id}`; return { ok: true }; });

// ---------- FOOD GROUP ----------
export const addFoodGroup = createServerFn({ method: "POST" })
  .inputValidator((d: { food_group_name: string }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("food_group", "food_group_id");
    await sql`INSERT INTO food_group (food_group_id, food_group_name) VALUES (${id}, ${data.food_group_name})`;
    return { id };
  });

// ---------- STORAGE ----------
export const addStorage = createServerFn({ method: "POST" })
  .inputValidator((d: { location: string; temperature: number | null }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("storage", "storage_id");
    await sql`INSERT INTO storage (storage_id, location, temperature) VALUES (${id}, ${data.location}, ${data.temperature})`;
    return { id };
  });

// ---------- UNITS ----------
export const addUnit = createServerFn({ method: "POST" })
  .inputValidator((d: { unit_name: string; unit_type: string | null }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("units", "unit_id");
    await sql`INSERT INTO units (unit_id, unit_name, unit_type) VALUES (${id}, ${data.unit_name}, ${data.unit_type})`;
    return { id };
  });

// ---------- STORES ----------
export const addStore = createServerFn({ method: "POST" })
  .inputValidator((d: { store_name: string; address: string | null }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("grocery_stores", "store_id");
    await sql`INSERT INTO grocery_stores (store_id, store_name, address) VALUES (${id}, ${data.store_name}, ${data.address})`;
    return { id };
  });

// ---------- RUNS ----------
export const addRun = createServerFn({ method: "POST" })
  .inputValidator((d: { store_id: number | null; bought_date: string | null }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("grocery_runs", "run_id");
    await sql`INSERT INTO grocery_runs (run_id, store_id, bought_date) VALUES (${id}, ${data.store_id}, ${data.bought_date})`;
    return { id };
  });

// ---------- RECIPES ----------
export const addRecipe = createServerFn({ method: "POST" })
  .inputValidator((d: { recipe_name: string; servings: number | null; instructions: string | null }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("recipe", "recipe_id");
    await sql`INSERT INTO recipe (recipe_id, recipe_name, servings, instructions) VALUES (${id}, ${data.recipe_name}, ${data.servings}, ${data.instructions})`;
    return { id };
  });
export const updateRecipe = createServerFn({ method: "POST" })
  .inputValidator((d: any) => d)
  .handler(async ({ data }) => { await sql`UPDATE recipe SET recipe_name=${data.recipe_name}, servings=${data.servings}, instructions=${data.instructions} WHERE recipe_id=${data.recipe_id}`; return { ok: true }; });
export const deleteRecipe = createServerFn({ method: "POST" })
  .inputValidator((d: { recipe_id: number }) => d)
  .handler(async ({ data }) => {
    await sql`DELETE FROM ingredients WHERE recipe_id=${data.recipe_id}`;
    await sql`DELETE FROM recipe WHERE recipe_id=${data.recipe_id}`;
    return { ok: true };
  });

export const getRecipeIngredients = createServerFn({ method: "GET" })
  .inputValidator((d: { recipe_id: number }) => d)
  .handler(async ({ data }) => {
    return await sql`
      SELECT i.recipe_id, i.food_id, f.food_name, i.quantity, i.unit_id, u.unit_name
      FROM ingredients i
      LEFT JOIN food f ON f.food_id = i.food_id
      LEFT JOIN units u ON u.unit_id = i.unit_id
      WHERE i.recipe_id = ${data.recipe_id}
      ORDER BY f.food_name`;
  });

export const addIngredient = createServerFn({ method: "POST" })
  .inputValidator((d: { recipe_id: number; food_id: number; quantity: number | null; unit_id: number | null }) => d)
  .handler(async ({ data }) => {
    await sql`INSERT INTO ingredients (recipe_id, food_id, quantity, unit_id) VALUES (${data.recipe_id}, ${data.food_id}, ${data.quantity}, ${data.unit_id})`;
    return { ok: true };
  });
export const deleteIngredient = createServerFn({ method: "POST" })
  .inputValidator((d: { recipe_id: number; food_id: number }) => d)
  .handler(async ({ data }) => { await sql`DELETE FROM ingredients WHERE recipe_id=${data.recipe_id} AND food_id=${data.food_id}`; return { ok: true }; });

// Recipe price estimate
export const getRecipePrice = createServerFn({ method: "GET" })
  .inputValidator((d: { recipe_id: number }) => d)
  .handler(async ({ data }) => {
    const r = await sql`
      SELECT r.recipe_name, COALESCE(SUM(ing.quantity * avg_price.avg_price), 0) AS estimated_price
      FROM recipe r
      JOIN ingredients ing ON ing.recipe_id = r.recipe_id
      LEFT JOIN (
        SELECT food_id, AVG(purchase_price / NULLIF(quantity,0)) AS avg_price
        FROM inventory WHERE purchase_price IS NOT NULL AND quantity > 0
        GROUP BY food_id
      ) avg_price ON avg_price.food_id = ing.food_id
      WHERE r.recipe_id = ${data.recipe_id}
      GROUP BY r.recipe_name`;
    return (r as any[])[0] || { recipe_name: "", estimated_price: 0 };
  });

// ---------- GROCERY LIST ----------
export const addList = createServerFn({ method: "POST" })
  .inputValidator((d: { list_name: string }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("grocery_list", "grocery_list_id");
    await sql`INSERT INTO grocery_list (grocery_list_id, list_name) VALUES (${id}, ${data.list_name})`;
    return { id };
  });

export const getListItems = createServerFn({ method: "GET" })
  .inputValidator((d: { grocery_list_id: number }) => d)
  .handler(async ({ data }) => {
    return await sql`
      SELECT gli.grocery_list_item_id, gli.grocery_list_id, gli.food_id, f.food_name,
             gli.notes, gli.auto_added, gli.quantity, gli.purchased, gli.unit_id, u.unit_name
      FROM grocery_list_items gli
      LEFT JOIN food f ON f.food_id = gli.food_id
      LEFT JOIN units u ON u.unit_id = gli.unit_id
      WHERE gli.grocery_list_id = ${data.grocery_list_id}
      ORDER BY gli.purchased, gli.grocery_list_item_id DESC`;
  });

export const addListItem = createServerFn({ method: "POST" })
  .inputValidator((d: { grocery_list_id: number; food_id: number | null; quantity: number | null; unit_id: number | null; notes: string | null; auto_added: boolean }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("grocery_list_items", "grocery_list_item_id");
    await sql`INSERT INTO grocery_list_items (grocery_list_item_id, grocery_list_id, food_id, notes, auto_added, quantity, purchased, unit_id)
      VALUES (${id}, ${data.grocery_list_id}, ${data.food_id}, ${data.notes}, ${data.auto_added}, ${data.quantity}, false, ${data.unit_id})`;
    return { id };
  });

export const toggleListItem = createServerFn({ method: "POST" })
  .inputValidator((d: { grocery_list_item_id: number; purchased: boolean }) => d)
  .handler(async ({ data }) => { await sql`UPDATE grocery_list_items SET purchased=${data.purchased} WHERE grocery_list_item_id=${data.grocery_list_item_id}`; return { ok: true }; });

export const deleteListItem = createServerFn({ method: "POST" })
  .inputValidator((d: { grocery_list_item_id: number }) => d)
  .handler(async ({ data }) => { await sql`DELETE FROM grocery_list_items WHERE grocery_list_item_id=${data.grocery_list_item_id}`; return { ok: true }; });

// ---------- USAGE LOG (with auto-add depleted) ----------
export const getUsageLog = createServerFn({ method: "GET" }).handler(async () => {
  return await sql`
    SELECT ul.log_id, ul.food_id, f.food_name, ul.recipe_id, r.recipe_name,
           ul.amount_used, ul.fully_depleted, ul.usage_date, ul.unit_id, u.unit_name
    FROM usage_log ul
    LEFT JOIN food f ON f.food_id = ul.food_id
    LEFT JOIN recipe r ON r.recipe_id = ul.recipe_id
    LEFT JOIN units u ON u.unit_id = ul.unit_id
    ORDER BY ul.usage_date DESC, ul.log_id DESC`;
});

export const logUsage = createServerFn({ method: "POST" })
  .inputValidator((d: { food_id: number; recipe_id: number | null; amount_used: number; unit_id: number | null; usage_date: string }) => d)
  .handler(async ({ data }) => {
    const id = await nextId("usage_log", "log_id");
    // Total available across inventory rows for this food
    const totals = await sql`SELECT COALESCE(SUM(quantity),0) AS total FROM inventory WHERE food_id=${data.food_id}`;
    const total = Number((totals as any[])[0].total);
    const remaining = total - data.amount_used;
    const depleted = remaining <= 0;
    await sql`INSERT INTO usage_log (log_id, food_id, recipe_id, amount_used, fully_depleted, usage_date, unit_id)
      VALUES (${id}, ${data.food_id}, ${data.recipe_id}, ${data.amount_used}, ${depleted}, ${data.usage_date}, ${data.unit_id})`;

    // Decrement inventory FIFO by expiration
    let toDeduct = data.amount_used;
    const rows = await sql`SELECT inventory_id, quantity FROM inventory WHERE food_id=${data.food_id} AND quantity > 0 ORDER BY expiration_date NULLS LAST, inventory_id`;
    for (const row of rows as any[]) {
      if (toDeduct <= 0) break;
      const q = Number(row.quantity);
      const take = Math.min(q, toDeduct);
      await sql`UPDATE inventory SET quantity = ${q - take} WHERE inventory_id=${row.inventory_id}`;
      toDeduct -= take;
    }

    // Auto-add to default grocery list if depleted
    if (depleted) {
      const lists = await sql`SELECT grocery_list_id FROM grocery_list ORDER BY grocery_list_id LIMIT 1`;
      if ((lists as any[]).length > 0) {
        const listId = (lists as any[])[0].grocery_list_id;
        const itemId = await nextId("grocery_list_items", "grocery_list_item_id");
        await sql`INSERT INTO grocery_list_items (grocery_list_item_id, grocery_list_id, food_id, notes, auto_added, quantity, purchased, unit_id)
          VALUES (${itemId}, ${listId}, ${data.food_id}, 'Auto-added: depleted', true, 1, false, ${data.unit_id})`;
      }
    }
    return { id, depleted };
  });

// ---------- RANKINGS ----------
export const getRankings = createServerFn({ method: "GET" }).handler(async () => {
  const [popularRecipes, popularFoods] = await Promise.all([
    sql`SELECT r.recipe_id, r.recipe_name, COUNT(ul.log_id)::int AS uses
        FROM recipe r LEFT JOIN usage_log ul ON ul.recipe_id = r.recipe_id
        GROUP BY r.recipe_id, r.recipe_name ORDER BY uses DESC, r.recipe_name LIMIT 10`,
    sql`SELECT f.food_id, f.food_name, COUNT(i.inventory_id)::int AS purchases
        FROM food f LEFT JOIN inventory i ON i.food_id = f.food_id
        GROUP BY f.food_id, f.food_name ORDER BY purchases DESC, f.food_name LIMIT 10`,
  ]);
  return { popularRecipes, popularFoods };
});

// ---------- MAKEABLE RECIPES ----------
export const getMakeableRecipes = createServerFn({ method: "GET" }).handler(async () => {
  return await sql`
    SELECT r.recipe_id, r.recipe_name,
           COUNT(ing.food_id)::int AS total_ingredients,
           SUM(CASE WHEN COALESCE(inv.total,0) >= ing.quantity THEN 1 ELSE 0 END)::int AS available
    FROM recipe r
    JOIN ingredients ing ON ing.recipe_id = r.recipe_id
    LEFT JOIN (SELECT food_id, SUM(quantity) AS total FROM inventory GROUP BY food_id) inv
           ON inv.food_id = ing.food_id
    GROUP BY r.recipe_id, r.recipe_name
    ORDER BY available::float / NULLIF(COUNT(ing.food_id),0) DESC NULLS LAST, r.recipe_name`;
});
