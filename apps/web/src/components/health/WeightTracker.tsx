"use client";

import { useState, useMemo } from "react";
import { Scale, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  useCreateWeightLogMutation,
  useGetWeightHistoryQuery,
  useUpdateWeightLogMutation,
  useDeleteWeightLogMutation,
} from "@/redux/api/weightLogApi";

interface Measurements {
  bodyFat: string;
  waist: string;
  hips: string;
  chest: string;
  arms: string;
}
const emptyMeas: Measurements = { bodyFat: "", waist: "", hips: "", chest: "", arms: "" };

const measFields: { key: keyof Measurements; label: string; unit: string }[] = [
  { key: "bodyFat", label: "Body Fat", unit: "%" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "arms", label: "Arms", unit: "cm" },
];

export default function WeightTracker() {
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [meas, setMeas] = useState<Measurements>(emptyMeas);
  const [showMeas, setShowMeas] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useGetWeightHistoryQuery({ days: 90 });
  const [createLog, { isLoading: creating }] = useCreateWeightLogMutation();
  const [updateLog, { isLoading: updating }] = useUpdateWeightLogMutation();
  const [deleteLog] = useDeleteWeightLogMutation();

  const history = useMemo(() => data?.data?.logs || [], [data?.data?.logs]);

  const trend = useMemo(() => {
    if (history.length < 2) return null;
    const diff = +(history[history.length - 1].weight - history[0].weight).toFixed(1);
    return diff;
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    try {
      const payload: Record<string, unknown> = { weight: parseFloat(weight) };
      if (notes) payload.notes = notes;
      if (showMeas) {
        (Object.keys(meas) as (keyof Measurements)[]).forEach((k) => {
          if (meas[k]) {
            const v = parseFloat(meas[k]);
            if (!isNaN(v)) payload[k] = v;
          }
        });
      }
      if (editId) {
        await updateLog({ id: editId, ...payload } as Parameters<typeof updateLog>[0]).unwrap();
      } else {
        await createLog(payload as Parameters<typeof createLog>[0]).unwrap();
      }
      setEditId(null);
      setWeight("");
      setNotes("");
      setMeas(emptyMeas);
    } catch {
      /* handled */
    }
  };

  const openEdit = (log: Parameters<typeof updateLog>[0]) => {
    setEditId(log.id);
    setWeight(String(log.weight));
    setNotes(log.notes || "");
    setMeas({
      bodyFat: log.bodyFat ? String(log.bodyFat) : "",
      waist: log.waist ? String(log.waist) : "",
      hips: log.hips ? String(log.hips) : "",
      chest: log.chest ? String(log.chest) : "",
      arms: log.arms ? String(log.arms) : "",
    });
    setShowMeas(Boolean(log.bodyFat || log.waist || log.hips || log.chest || log.arms));
  };

  const hasMeas = (log: {
    bodyFat?: number;
    waist?: number;
    hips?: number;
    chest?: number;
    arms?: number;
  }) => Boolean(log.bodyFat || log.waist || log.hips || log.chest || log.arms);

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand-purple/15 text-brand-purple">
            <Scale className="size-4" />
          </div>
          <h3 className="font-display text-sm font-semibold">Weight Tracker</h3>
        </div>
        <Button variant="ghost" size="xs" onClick={() => setShowMeas(!showMeas)}>
          {showMeas ? (
            <>
              <ChevronUp />
              Hide
            </>
          ) : (
            <>
              <ChevronDown />
              Measurements
            </>
          )}
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-end gap-2">
          <Field className="flex-1">
            <FieldLabel className="text-xs">Weight (kg)</FieldLabel>
            <Input
              type="number"
              step="0.1"
              placeholder="70.0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </Field>
          {editId && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditId(null);
                setWeight("");
                setNotes("");
                setMeas(emptyMeas);
              }}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={creating || updating}>
            {creating || updating ? "..." : editId ? "Update" : "Log"}
          </Button>
        </div>

        <Field>
          <FieldLabel className="text-xs">Notes</FieldLabel>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note..."
          />
        </Field>

        <AnimatePresence>
          {showMeas && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--border-default)] p-3">
                {measFields.map((f) => (
                  <div key={f.key} className="space-y-0.5">
                    <FieldLabel className="text-[10px] text-muted-foreground">
                      {f.label} ({f.unit})
                    </FieldLabel>
                    <Input
                      type="number"
                      step="0.1"
                      value={meas[f.key]}
                      onChange={(e) => setMeas({ ...meas, [f.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {trend !== null && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">90d trend:</span>
          <span
            className={`font-mono font-semibold ${trend <= 0 ? "text-brand-green" : "text-brand-amber"}`}
          >
            {trend > 0 ? "+" : ""}
            {trend} kg
          </span>
        </div>
      )}

      <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
        ) : history.length > 0 ? (
          [...history]
            .reverse()
            .slice(0, 20)
            .map((log) => (
              <div key={log.id} className="rounded-xl bg-[var(--bg-subtle)] px-2.5 py-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.weight} kg</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.date).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(log)}
                      className="size-6 text-muted-foreground hover:text-brand-teal"
                    >
                      <svg
                        className="size-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteLog(log.id)}
                      className="size-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
                {hasMeas(log) && (
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                    {log.bodyFat && <span>Fat: {log.bodyFat}%</span>}
                    {log.waist && <span>Waist: {log.waist}cm</span>}
                    {log.hips && <span>Hips: {log.hips}cm</span>}
                    {log.chest && <span>Chest: {log.chest}cm</span>}
                    {log.arms && <span>Arms: {log.arms}cm</span>}
                  </div>
                )}
              </div>
            ))
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">No weight logs yet</p>
        )}
      </div>
    </GlassCard>
  );
}
