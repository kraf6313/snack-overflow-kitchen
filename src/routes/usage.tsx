import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Label, PageHeader, Select } from "@/components/ui-bits";
import { getLookups, getUsageLog, logUsage } from "@/lib/api.functions";

export const Route = createFileRoute("/usage")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const lk = useQuery({ queryKey: ["lookups"], queryFn: () => getLookups() });
  const log = useQuery({ queryKey: ["usage"], queryFn: () => getUsageLog() });
  const [f, setF] = useState({ food_id: "", recipe_id: "", amount_used: "", unit_id: "", usage_date: new Date().toISOString().slice(0, 10) });

  const submit = useMutation({
    mutationFn: () => logUsage({ data: {
      food_id: Number(f.food_id), recipe_id: f.recipe_id ? Number(f.recipe_id) : null,
      amount_used: Number(f.amount_used), unit_id: f.unit_id ? Number(f.unit_id) : null,
      usage_date: f.usage_date,
    }}),
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ["usage"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["listitems"] });
      qc.invalidateQueries({ queryKey: ["rankings"] });
      setF({ food_id: "", recipe_id: "", amount_used: "", unit_id: "", usage_date: new Date().toISOString().slice(0, 10) });
      if (r?.depleted) alert("📭 Item depleted — auto-added to your grocery list!");
    },
  });

  return (
    <AppShell>
      <PageHeader title="Usage Log" emoji="🍴" subtitle="Track ingredients used. Inventory updates automatically." />

      <Card className="mb-6 border-primary/30">
        <h3 className="text-lg font-bold mb-4">Log new usage</h3>
        <div className="grid md:grid-cols-5 gap-3">
          <div><Label>Food</Label>
            <Select value={f.food_id} onChange={(e) => setF({ ...f, food_id: e.target.value })}>
              <option value="">—</option>
              {(lk.data as any)?.foods?.map((x: any) => <option key={x.food_id} value={x.food_id}>{x.food_name}</option>)}
            </Select>
          </div>
          <div><Label>Recipe (optional)</Label>
            <Select value={f.recipe_id} onChange={(e) => setF({ ...f, recipe_id: e.target.value })}>
              <option value="">—</option>
              {(lk.data as any)?.recipes?.map((x: any) => <option key={x.recipe_id} value={x.recipe_id}>{x.recipe_name}</option>)}
            </Select>
          </div>
          <div><Label>Amount used</Label><Input type="number" step="0.01" value={f.amount_used} onChange={(e) => setF({ ...f, amount_used: e.target.value })} /></div>
          <div><Label>Unit</Label>
            <Select value={f.unit_id} onChange={(e) => setF({ ...f, unit_id: e.target.value })}>
              <option value="">—</option>
              {(lk.data as any)?.units?.map((x: any) => <option key={x.unit_id} value={x.unit_id}>{x.unit_name}</option>)}
            </Select>
          </div>
          <div><Label>Date</Label><Input type="date" value={f.usage_date} onChange={(e) => setF({ ...f, usage_date: e.target.value })} /></div>
        </div>
        <Button className="mt-4" onClick={() => submit.mutate()} disabled={!f.food_id || !f.amount_used}>Log usage</Button>
      </Card>

      <h2 className="font-bold text-xl mb-3">History</h2>
      <div className="grid gap-2">
        {((log.data as any[]) || []).map((l: any) => (
          <Card key={l.log_id} className="!p-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <span className="font-medium">{l.food_name ?? "—"}</span>
                <span className="text-muted-foreground"> · {l.amount_used} {l.unit_name ?? ""}</span>
                {l.recipe_name && <span className="text-muted-foreground"> · for {l.recipe_name}</span>}
              </div>
              <div className="flex items-center gap-2">
                {l.fully_depleted && <Badge tone="tomato">depleted</Badge>}
                <span className="text-xs text-muted-foreground">{new Date(l.usage_date).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
