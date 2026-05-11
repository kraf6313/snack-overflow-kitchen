import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Label, PageHeader, Select } from "@/components/ui-bits";
import {
  addInventory, deleteInventory, getInventory, getLookups, updateInventory,
} from "@/lib/api.functions";

export const Route = createFileRoute("/inventory")({ component: Page });

type Sort = "expiration_date" | "food_name" | "bought_date";

function Page() {
  const qc = useQueryClient();
  const inv = useQuery({ queryKey: ["inventory"], queryFn: () => getInventory() });
  const lk = useQuery({ queryKey: ["lookups"], queryFn: () => getLookups() });
  const [sort, setSort] = useState<Sort>("expiration_date");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const del = useMutation({
    mutationFn: (id: number) => deleteInventory({ data: { inventory_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const items = ((inv.data as any[]) || []).filter((i) => groupFilter === "all" || i.food_group_name === groupFilter);
  const sorted = [...items].sort((a, b) => {
    if (sort === "food_name") return (a.food_name ?? "").localeCompare(b.food_name ?? "");
    if (sort === "bought_date") return new Date(b.bought_date ?? 0).getTime() - new Date(a.bought_date ?? 0).getTime();
    return new Date(a.expiration_date ?? "9999-12-31").getTime() - new Date(b.expiration_date ?? "9999-12-31").getTime();
  });

  const groups = Array.from(new Set(((inv.data as any[]) || []).map((i) => i.food_group_name).filter(Boolean)));

  return (
    <AppShell>
      <PageHeader title="Inventory" emoji="🥫" subtitle="Everything in your pantry, fridge, and freezer."
        action={<Button onClick={() => { setEditing(null); setShowForm(true); }}>＋ Add item</Button>} />

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <Label>Sort by</Label>
          <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="expiration_date">Expiration date</option>
            <option value="food_name">Food name</option>
            <option value="bought_date">Recently bought</option>
          </Select>
        </div>
        <div>
          <Label>Filter group</Label>
          <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            <option value="all">All groups</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
        </div>
      </div>

      {showForm && (
        <InventoryForm
          lookups={lk.data}
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["inventory"] }); setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="grid gap-3">
        {sorted.map((i: any) => (
          <Card key={i.inventory_id} className="!p-4">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg">{i.food_name ?? "—"}</span>
                  {i.food_group_name && <Badge tone="leaf">{i.food_group_name}</Badge>}
                  {i.opened_date && <Badge tone="butter">opened {fmt(i.opened_date)}</Badge>}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-3">
                  <span>📍 {i.storage_location ?? "—"}</span>
                  <span>🛒 {i.store_name ?? "—"} {i.bought_date && `· ${fmt(i.bought_date)}`}</span>
                  <span>📦 {i.quantity ?? "—"} {i.unit_name ?? ""}</span>
                  {i.purchase_price != null && <span>💵 ${Number(i.purchase_price).toFixed(2)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ExpBadge date={i.expiration_date} />
                <Button variant="ghost" onClick={() => { setEditing(i); setShowForm(true); }}>Edit</Button>
                <Button variant="danger" onClick={() => confirm("Delete this inventory item?") && del.mutate(i.inventory_id)}>✕</Button>
              </div>
            </div>
          </Card>
        ))}
        {sorted.length === 0 && <p className="text-center text-muted-foreground py-12">No items yet — add your first one!</p>}
      </div>
    </AppShell>
  );
}

function fmt(d: string) { return new Date(d).toLocaleDateString(); }

function ExpBadge({ date }: { date: string | null }) {
  if (!date) return <Badge tone="muted">no exp</Badge>;
  const days = Math.floor((new Date(date).getTime() - Date.now()) / 86400000);
  if (days < 0) return <Badge tone="tomato">expired</Badge>;
  if (days <= 3) return <Badge tone="tomato">{days}d left</Badge>;
  if (days <= 7) return <Badge tone="butter">{days}d left</Badge>;
  return <Badge tone="leaf">{days}d left</Badge>;
}

function InventoryForm({ lookups, editing, onClose, onSaved }: { lookups: any; editing: any | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    food_id: editing?.food_id ?? "",
    storage_id: editing?.storage_id ?? "",
    run_id: editing?.run_id ?? "",
    purchase_price: editing?.purchase_price ?? "",
    expiration_date: editing?.expiration_date?.slice(0, 10) ?? "",
    opened_date: editing?.opened_date?.slice(0, 10) ?? "",
    quantity: editing?.quantity ?? "",
    unit_id: editing?.unit_id ?? "",
  });
  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        food_id: f.food_id ? Number(f.food_id) : null,
        storage_id: f.storage_id ? Number(f.storage_id) : null,
        run_id: f.run_id ? Number(f.run_id) : null,
        purchase_price: f.purchase_price ? Number(f.purchase_price) : null,
        expiration_date: f.expiration_date || null,
        opened_date: f.opened_date || null,
        quantity: f.quantity ? Number(f.quantity) : null,
        unit_id: f.unit_id ? Number(f.unit_id) : null,
      };
      if (editing) return updateInventory({ data: { ...payload, inventory_id: editing.inventory_id } });
      return addInventory({ data: payload });
    },
    onSuccess: onSaved,
  });

  return (
    <Card className="mb-6 border-primary/30">
      <h3 className="text-lg font-bold mb-4">{editing ? "Edit" : "Add"} inventory item</h3>
      <div className="grid md:grid-cols-3 gap-3">
        <div><Label>Food</Label>
          <Select value={f.food_id} onChange={(e) => setF({ ...f, food_id: e.target.value })}>
            <option value="">— select —</option>
            {lookups?.foods?.map((x: any) => <option key={x.food_id} value={x.food_id}>{x.food_name}</option>)}
          </Select>
        </div>
        <div><Label>Storage</Label>
          <Select value={f.storage_id} onChange={(e) => setF({ ...f, storage_id: e.target.value })}>
            <option value="">— none —</option>
            {lookups?.storages?.map((x: any) => <option key={x.storage_id} value={x.storage_id}>{x.location} ({x.temperature ?? "?"}°)</option>)}
          </Select>
        </div>
        <div><Label>Grocery run</Label>
          <Select value={f.run_id} onChange={(e) => setF({ ...f, run_id: e.target.value })}>
            <option value="">— none —</option>
            {lookups?.runs?.map((x: any) => {
              const store = lookups?.stores?.find((s: any) => s.store_id === x.store_id)?.store_name ?? "?";
              return <option key={x.run_id} value={x.run_id}>{store} · {x.bought_date ? new Date(x.bought_date).toLocaleDateString() : ""}</option>;
            })}
          </Select>
        </div>
        <div><Label>Quantity</Label><Input type="number" step="0.01" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} /></div>
        <div><Label>Unit</Label>
          <Select value={f.unit_id} onChange={(e) => setF({ ...f, unit_id: e.target.value })}>
            <option value="">—</option>
            {lookups?.units?.map((x: any) => <option key={x.unit_id} value={x.unit_id}>{x.unit_name}</option>)}
          </Select>
        </div>
        <div><Label>Purchase price ($)</Label><Input type="number" step="0.01" value={f.purchase_price} onChange={(e) => setF({ ...f, purchase_price: e.target.value })} /></div>
        <div><Label>Expiration date</Label><Input type="date" value={f.expiration_date} onChange={(e) => setF({ ...f, expiration_date: e.target.value })} /></div>
        <div><Label>Opened date</Label><Input type="date" value={f.opened_date} onChange={(e) => setF({ ...f, opened_date: e.target.value })} /></div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </Card>
  );
}
