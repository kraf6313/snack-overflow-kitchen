import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Label, PageHeader, Select } from "@/components/ui-bits";
import {
  addList, addListItem, deleteListItem, getListItems, getLookups, toggleListItem,
} from "@/lib/api.functions";

export const Route = createFileRoute("/grocery")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const lk = useQuery({ queryKey: ["lookups"], queryFn: () => getLookups() });
  const lists = ((lk.data as any)?.lists ?? []) as any[];
  const [activeId, setActiveId] = useState<number | null>(null);
  useEffect(() => { if (activeId === null && lists[0]) setActiveId(lists[0].grocery_list_id); }, [lists, activeId]);

  const [newName, setNewName] = useState("");
  const create = useMutation({
    mutationFn: () => addList({ data: { list_name: newName } }),
    onSuccess: (r) => { setNewName(""); qc.invalidateQueries({ queryKey: ["lookups"] }); setActiveId((r as any).id); },
  });

  return (
    <AppShell>
      <PageHeader title="Grocery Lists" emoji="🛒" subtitle="Plan your runs. Depleted items get auto-added when logged." />
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {lists.map((l: any) => (
          <Button key={l.grocery_list_id} variant={l.grocery_list_id === activeId ? "primary" : "soft"}
            onClick={() => setActiveId(l.grocery_list_id)}>{l.list_name}</Button>
        ))}
        <div className="flex gap-2 ml-auto">
          <Input placeholder="New list name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={() => create.mutate()} disabled={!newName}>＋</Button>
        </div>
      </div>

      {activeId && <ListView listId={activeId} lookups={lk.data} />}
    </AppShell>
  );
}

function ListView({ listId, lookups }: { listId: number; lookups: any }) {
  const qc = useQueryClient();
  const items = useQuery({ queryKey: ["listitems", listId], queryFn: () => getListItems({ data: { grocery_list_id: listId } }) });
  const [f, setF] = useState({ food_id: "", quantity: "1", unit_id: "", notes: "" });

  const add = useMutation({
    mutationFn: () => addListItem({ data: {
      grocery_list_id: listId, food_id: f.food_id ? Number(f.food_id) : null,
      quantity: f.quantity ? Number(f.quantity) : null, unit_id: f.unit_id ? Number(f.unit_id) : null,
      notes: f.notes || null, auto_added: false,
    }}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["listitems", listId] }); setF({ food_id: "", quantity: "1", unit_id: "", notes: "" }); },
  });
  const toggle = useMutation({
    mutationFn: (v: { id: number; purchased: boolean }) => toggleListItem({ data: { grocery_list_item_id: v.id, purchased: v.purchased } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listitems", listId] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteListItem({ data: { grocery_list_item_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listitems", listId] }),
  });

  const rows = (items.data as any[]) || [];
  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
        <Select value={f.food_id} onChange={(e) => setF({ ...f, food_id: e.target.value })}>
          <option value="">— food —</option>
          {lookups?.foods?.map((x: any) => <option key={x.food_id} value={x.food_id}>{x.food_name}</option>)}
        </Select>
        <Input type="number" step="0.01" placeholder="qty" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
        <Select value={f.unit_id} onChange={(e) => setF({ ...f, unit_id: e.target.value })}>
          <option value="">unit</option>
          {lookups?.units?.map((x: any) => <option key={x.unit_id} value={x.unit_id}>{x.unit_name}</option>)}
        </Select>
        <Input placeholder="notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        <Button onClick={() => add.mutate()} disabled={!f.food_id}>＋ Add</Button>
      </div>
      <ul className="space-y-2">
        {rows.map((it) => (
          <li key={it.grocery_list_item_id} className={`flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2 ${it.purchased ? "opacity-50" : ""}`}>
            <input type="checkbox" checked={!!it.purchased} onChange={(e) => toggle.mutate({ id: it.grocery_list_item_id, purchased: e.target.checked })} className="w-5 h-5 accent-primary" />
            <div className="flex-1">
              <div className={`font-medium ${it.purchased ? "line-through" : ""}`}>{it.food_name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                {it.quantity ?? ""} {it.unit_name ?? ""} {it.notes && `· ${it.notes}`}
              </div>
            </div>
            {it.auto_added && <Badge tone="butter">auto</Badge>}
            <button onClick={() => del.mutate(it.grocery_list_item_id)} className="text-destructive text-sm">✕</button>
          </li>
        ))}
        {rows.length === 0 && <p className="text-center text-muted-foreground py-6">List is empty.</p>}
      </ul>
    </Card>
  );
}
