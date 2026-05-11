import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, Badge } from "@/components/ui-bits";
import { getInventory, getMakeableRecipes, getRankings } from "@/lib/api.functions";

export const Route = createFileRoute("/")({
  component: Page,
});

function daysUntil(d: string | null) {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.floor(ms / 86400000);
}

function Page() {
  const inv = useQuery({ queryKey: ["inventory"], queryFn: () => getInventory() });
  const makeable = useQuery({ queryKey: ["makeable"], queryFn: () => getMakeableRecipes() });
  const ranks = useQuery({ queryKey: ["rankings"], queryFn: () => getRankings() });

  const items = (inv.data as any[]) || [];
  const expiring = items
    .filter((i) => i.expiration_date)
    .sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime())
    .slice(0, 6);

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold">
          Welcome to your <span className="text-primary">pantry</span> 🥗
        </h1>
        <p className="text-muted-foreground mt-2">A cozy overview of what's fresh, what's running low, and what to cook next.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard emoji="🥫" label="Items in inventory" value={items.length} />
        <StatCard emoji="⏰" label="Expiring soon (≤7 days)" value={items.filter(i => { const d = daysUntil(i.expiration_date); return d !== null && d <= 7; }).length} />
        <StatCard emoji="📖" label="Recipes available" value={(makeable.data as any[])?.length ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">⏳ Expiring Soonest</h2>
          {expiring.length === 0 && <p className="text-sm text-muted-foreground">No items with expiration dates yet.</p>}
          <ul className="space-y-2">
            {expiring.map((i: any) => {
              const d = daysUntil(i.expiration_date);
              const tone = d !== null && d < 0 ? "tomato" : d !== null && d <= 3 ? "tomato" : d !== null && d <= 7 ? "butter" : "leaf";
              return (
                <li key={i.inventory_id} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
                  <div>
                    <div className="font-medium">{i.food_name ?? `Item #${i.inventory_id}`}</div>
                    <div className="text-xs text-muted-foreground">{i.storage_location ?? "—"} · {i.store_name ?? "Unknown store"}</div>
                  </div>
                  <Badge tone={tone}>{d === null ? "—" : d < 0 ? `expired ${-d}d ago` : d === 0 ? "today" : `${d}d`}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🍳 What you can cook</h2>
          {!makeable.data || (makeable.data as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground">Add some recipes and ingredients to see suggestions.</p>
          ) : (
            <ul className="space-y-2">
              {(makeable.data as any[]).slice(0, 6).map((r) => (
                <li key={r.recipe_id} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
                  <span className="font-medium">{r.recipe_name}</span>
                  <Badge tone={r.available === r.total_ingredients ? "leaf" : "butter"}>
                    {r.available}/{r.total_ingredients} ingredients
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">⭐ Most-used recipes</h2>
          <ul className="space-y-1">
            {((ranks.data as any)?.popularRecipes ?? []).slice(0, 5).map((r: any) => (
              <li key={r.recipe_id} className="flex justify-between text-sm py-1">
                <span>{r.recipe_name}</span><span className="text-muted-foreground">{r.uses} uses</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">🛒 Most-bought foods</h2>
          <ul className="space-y-1">
            {((ranks.data as any)?.popularFoods ?? []).slice(0, 5).map((r: any) => (
              <li key={r.food_id} className="flex justify-between text-sm py-1">
                <span>{r.food_name}</span><span className="text-muted-foreground">{r.purchases}×</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="text-4xl">{emoji}</div>
      <div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}
