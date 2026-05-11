import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Label, PageHeader, Select } from "@/components/ui-bits";
import {
  addFood, addFoodGroup, addRun, addStorage, addStore, addUnit, deleteFood,
  getLookups, updateFood,
} from "@/lib/api.functions";

export const Route = createFileRoute("/manage")({ component: Page });

function Page() {
  return (
    <AppShell>
      <PageHeader title="Manage" emoji="🧺" subtitle="Foods, groups, units, storage spots, and stores." />
      <div className="grid md:grid-cols-2 gap-6">
        <FoodsPanel />
        <SimplePanel
          title="Food groups" emoji="🥦" listKey="foodGroups" idKey="food_group_id" nameKey="food_group_name"
          onAdd={(name) => addFoodGroup({ data: { food_group_name: name } })}
        />
        <SimplePanel
          title="Units" emoji="📏" listKey="units" idKey="unit_id" nameKey="unit_name" extraKey="unit_type"
          onAdd={(name, extra) => addUnit({ data: { unit_name: name, unit_type: extra || null } })}
        />
        <StoragePanel />
        <StoresPanel />
        <RunsPanel />
      </div>
    </AppShell>
  );
}

function useLk() { return useQuery({ queryKey: ["lookups"], queryFn: () => getLookups() }); }

function FoodsPanel() {
  const qc = useQueryClient();
  const lk = useLk();
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const add = useMutation({
    mutationFn: () => addFood({ data: { food_name: name, food_group_id: groupId ? Number(groupId) : null } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lookups"] }); setName(""); setGroupId(""); },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteFood({ data: { food_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lookups"] }),
  });
  const update = useMutation({
    mutationFn: (v: any) => updateFood({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lookups"] }),
  });

  return (
    <Card>
      <h3 className="font-bold text-lg mb-3">🥕 Foods</h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Input placeholder="Food name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="">— group —</option>
          {(lk.data as any)?.foodGroups?.map((g: any) => <option key={g.food_group_id} value={g.food_group_id}>{g.food_group_name}</option>)}
        </Select>
        <Button onClick={() => add.mutate()} disabled={!name}>Add</Button>
      </div>
      <ul className="space-y-1 max-h-72 overflow-auto">
        {(lk.data as any)?.foods?.map((f: any) => (
          <li key={f.food_id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-2 py-1 text-sm">
            <Input value={f.food_name ?? ""} onChange={(e) => update.mutate({ food_id: f.food_id, food_name: e.target.value, food_group_id: f.food_group_id })}
              className="!py-1" />
            <Select value={f.food_group_id ?? ""} onChange={(e) => update.mutate({ food_id: f.food_id, food_name: f.food_name, food_group_id: e.target.value ? Number(e.target.value) : null })} className="!py-1 max-w-[140px]">
              <option value="">—</option>
              {(lk.data as any)?.foodGroups?.map((g: any) => <option key={g.food_group_id} value={g.food_group_id}>{g.food_group_name}</option>)}
            </Select>
            <button className="text-destructive" onClick={() => confirm("Delete?") && del.mutate(f.food_id)}>✕</button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SimplePanel({ title, emoji, listKey, idKey, nameKey, extraKey, onAdd }: {
  title: string; emoji: string; listKey: string; idKey: string; nameKey: string; extraKey?: string; onAdd: (name: string, extra?: string) => Promise<any>;
}) {
  const qc = useQueryClient();
  const lk = useLk();
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const add = useMutation({
    mutationFn: () => onAdd(name, extra),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lookups"] }); setName(""); setExtra(""); },
  });
  return (
    <Card>
      <h3 className="font-bold text-lg mb-3">{emoji} {title}</h3>
      <div className="flex gap-2 mb-3">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        {extraKey && <Input placeholder="Type" value={extra} onChange={(e) => setExtra(e.target.value)} />}
        <Button onClick={() => add.mutate()} disabled={!name}>Add</Button>
      </div>
      <ul className="space-y-1 max-h-60 overflow-auto">
        {(lk.data as any)?.[listKey]?.map((x: any) => (
          <li key={x[idKey]} className="bg-muted/40 rounded-lg px-3 py-1.5 text-sm flex justify-between">
            <span>{x[nameKey]}</span>
            {extraKey && <Badge tone="muted">{x[extraKey] ?? "—"}</Badge>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StoragePanel() {
  const qc = useQueryClient();
  const lk = useLk();
  const [f, setF] = useState({ location: "", temperature: "" });
  const add = useMutation({
    mutationFn: () => addStorage({ data: { location: f.location, temperature: f.temperature ? Number(f.temperature) : null } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lookups"] }); setF({ location: "", temperature: "" }); },
  });
  return (
    <Card>
      <h3 className="font-bold text-lg mb-3">❄️ Storage spots</h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Input placeholder="Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        <Input placeholder="Temp °F" type="number" value={f.temperature} onChange={(e) => setF({ ...f, temperature: e.target.value })} />
        <Button onClick={() => add.mutate()} disabled={!f.location}>Add</Button>
      </div>
      <ul className="space-y-1 max-h-60 overflow-auto">
        {(lk.data as any)?.storages?.map((s: any) => (
          <li key={s.storage_id} className="bg-muted/40 rounded-lg px-3 py-1.5 text-sm flex justify-between">
            <span>{s.location}</span><Badge tone="muted">{s.temperature ?? "?"}°</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StoresPanel() {
  const qc = useQueryClient();
  const lk = useLk();
  const [f, setF] = useState({ store_name: "", address: "" });
  const add = useMutation({
    mutationFn: () => addStore({ data: { store_name: f.store_name, address: f.address || null } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lookups"] }); setF({ store_name: "", address: "" }); },
  });
  return (
    <Card>
      <h3 className="font-bold text-lg mb-3">🏪 Grocery stores</h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Input placeholder="Store name" value={f.store_name} onChange={(e) => setF({ ...f, store_name: e.target.value })} />
        <Input placeholder="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <Button onClick={() => add.mutate()} disabled={!f.store_name}>Add</Button>
      </div>
      <ul className="space-y-1 max-h-60 overflow-auto">
        {(lk.data as any)?.stores?.map((s: any) => (
          <li key={s.store_id} className="bg-muted/40 rounded-lg px-3 py-1.5 text-sm">
            <div className="font-medium">{s.store_name}</div>
            <div className="text-xs text-muted-foreground">{s.address ?? "—"}</div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RunsPanel() {
  const qc = useQueryClient();
  const lk = useLk();
  const [f, setF] = useState({ store_id: "", bought_date: new Date().toISOString().slice(0, 10) });
  const add = useMutation({
    mutationFn: () => addRun({ data: { store_id: f.store_id ? Number(f.store_id) : null, bought_date: f.bought_date } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lookups"] }); setF({ store_id: "", bought_date: new Date().toISOString().slice(0, 10) }); },
  });
  return (
    <Card>
      <h3 className="font-bold text-lg mb-3">🛍️ Grocery runs</h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Select value={f.store_id} onChange={(e) => setF({ ...f, store_id: e.target.value })}>
          <option value="">— store —</option>
          {(lk.data as any)?.stores?.map((s: any) => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
        </Select>
        <Input type="date" value={f.bought_date} onChange={(e) => setF({ ...f, bought_date: e.target.value })} />
        <Button onClick={() => add.mutate()} disabled={!f.store_id}>Add</Button>
      </div>
      <ul className="space-y-1 max-h-60 overflow-auto">
        {(lk.data as any)?.runs?.slice(0, 20).map((r: any) => {
          const store = (lk.data as any)?.stores?.find((s: any) => s.store_id === r.store_id)?.store_name ?? "?";
          return (
            <li key={r.run_id} className="bg-muted/40 rounded-lg px-3 py-1.5 text-sm flex justify-between">
              <span>{store}</span>
              <span className="text-muted-foreground">{r.bought_date ? new Date(r.bought_date).toLocaleDateString() : "—"}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
