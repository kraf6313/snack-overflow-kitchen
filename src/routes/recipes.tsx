import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Label, PageHeader, Select, Textarea } from "@/components/ui-bits";
import {
  addIngredient, addRecipe, deleteIngredient, deleteRecipe, getLookups,
  getMakeableRecipes, getRecipeIngredients, getRecipePrice, updateRecipe,
} from "@/lib/api.functions";

export const Route = createFileRoute("/recipes")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const lk = useQuery({ queryKey: ["lookups"], queryFn: () => getLookups() });
  const makeable = useQuery({ queryKey: ["makeable"], queryFn: () => getMakeableRecipes() });
  const [openId, setOpenId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const recipes = (lk.data as any)?.recipes ?? [];
  const availability: Record<number, { available: number; total: number }> = {};
  ((makeable.data as any[]) ?? []).forEach((m) => { availability[m.recipe_id] = { available: m.available, total: m.total_ingredients }; });

  const del = useMutation({
    mutationFn: (id: number) => deleteRecipe({ data: { recipe_id: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lookups"] }); qc.invalidateQueries({ queryKey: ["makeable"] }); },
  });

  return (
    <AppShell>
      <PageHeader title="Recipes" emoji="📖" subtitle="Browse, add, and check what you can make right now."
        action={<Button onClick={() => { setEditing(null); setAdding(true); }}>＋ New recipe</Button>} />

      {adding && <RecipeForm editing={editing} onClose={() => { setAdding(false); setEditing(null); }}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["lookups"] }); setAdding(false); setEditing(null); }} />}

      <div className="grid md:grid-cols-2 gap-4">
        {recipes.map((r: any) => {
          const av = availability[r.recipe_id];
          return (
            <Card key={r.recipe_id}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-lg">{r.recipe_name}</h3>
                  <div className="text-sm text-muted-foreground">Serves {r.servings ?? "?"}</div>
                </div>
                {av && <Badge tone={av.available === av.total ? "leaf" : "butter"}>{av.available}/{av.total}</Badge>}
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="soft" onClick={() => setOpenId(openId === r.recipe_id ? null : r.recipe_id)}>
                  {openId === r.recipe_id ? "Hide" : "Details"}
                </Button>
                <Button variant="ghost" onClick={() => { setEditing(r); setAdding(true); }}>Edit</Button>
                <Button variant="danger" onClick={() => confirm("Delete recipe?") && del.mutate(r.recipe_id)}>✕</Button>
              </div>
              {openId === r.recipe_id && <RecipeDetails recipe={r} lookups={lk.data} />}
            </Card>
          );
        })}
        {recipes.length === 0 && <p className="text-center text-muted-foreground py-12 col-span-2">No recipes yet.</p>}
      </div>
    </AppShell>
  );
}

function RecipeForm({ editing, onClose, onSaved }: { editing: any | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    recipe_name: editing?.recipe_name ?? "",
    servings: editing?.servings ?? "",
    instructions: editing?.instructions ?? "",
  });
  const save = useMutation({
    mutationFn: async () => {
      const payload = { recipe_name: f.recipe_name, servings: f.servings ? Number(f.servings) : null, instructions: f.instructions || null };
      if (editing) return updateRecipe({ data: { ...payload, recipe_id: editing.recipe_id } });
      return addRecipe({ data: payload });
    },
    onSuccess: onSaved,
  });
  return (
    <Card className="mb-6 border-primary/30">
      <h3 className="text-lg font-bold mb-4">{editing ? "Edit" : "New"} recipe</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <div><Label>Recipe name</Label><Input value={f.recipe_name} onChange={(e) => setF({ ...f, recipe_name: e.target.value })} /></div>
        <div><Label>Servings</Label><Input type="number" value={f.servings} onChange={(e) => setF({ ...f, servings: e.target.value })} /></div>
      </div>
      <div className="mt-3"><Label>Instructions</Label><Textarea rows={5} value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></div>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => save.mutate()} disabled={save.isPending || !f.recipe_name}>{save.isPending ? "Saving..." : "Save"}</Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </Card>
  );
}

function RecipeDetails({ recipe, lookups }: { recipe: any; lookups: any }) {
  const qc = useQueryClient();
  const ings = useQuery({ queryKey: ["ings", recipe.recipe_id], queryFn: () => getRecipeIngredients({ data: { recipe_id: recipe.recipe_id } }) });
  const price = useQuery({ queryKey: ["price", recipe.recipe_id], queryFn: () => getRecipePrice({ data: { recipe_id: recipe.recipe_id } }) });
  const [f, setF] = useState({ food_id: "", quantity: "", unit_id: "" });

  const add = useMutation({
    mutationFn: () => addIngredient({ data: {
      recipe_id: recipe.recipe_id, food_id: Number(f.food_id),
      quantity: f.quantity ? Number(f.quantity) : null, unit_id: f.unit_id ? Number(f.unit_id) : null,
    }}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ings", recipe.recipe_id] }); qc.invalidateQueries({ queryKey: ["makeable"] }); setF({ food_id: "", quantity: "", unit_id: "" }); },
  });
  const del = useMutation({
    mutationFn: (food_id: number) => deleteIngredient({ data: { recipe_id: recipe.recipe_id, food_id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ings", recipe.recipe_id] }); qc.invalidateQueries({ queryKey: ["makeable"] }); },
  });

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      {recipe.instructions && <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-xl p-3">{recipe.instructions}</div>}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Ingredients</h4>
          {price.data && <Badge tone="leaf">~${Number((price.data as any).estimated_price ?? 0).toFixed(2)}</Badge>}
        </div>
        <ul className="space-y-1">
          {((ings.data as any[]) ?? []).map((i) => (
            <li key={i.food_id} className="flex justify-between text-sm bg-muted/40 rounded-lg px-3 py-1.5">
              <span>{i.food_name} — {i.quantity ?? "?"} {i.unit_name ?? ""}</span>
              <button className="text-destructive text-xs" onClick={() => del.mutate(i.food_id)}>remove</button>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-4 gap-2 mt-3">
          <Select value={f.food_id} onChange={(e) => setF({ ...f, food_id: e.target.value })}>
            <option value="">+ food</option>
            {lookups?.foods?.map((x: any) => <option key={x.food_id} value={x.food_id}>{x.food_name}</option>)}
          </Select>
          <Input type="number" step="0.01" placeholder="qty" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
          <Select value={f.unit_id} onChange={(e) => setF({ ...f, unit_id: e.target.value })}>
            <option value="">unit</option>
            {lookups?.units?.map((x: any) => <option key={x.unit_id} value={x.unit_id}>{x.unit_name}</option>)}
          </Select>
          <Button onClick={() => add.mutate()} disabled={!f.food_id}>Add</Button>
        </div>
      </div>
    </div>
  );
}
