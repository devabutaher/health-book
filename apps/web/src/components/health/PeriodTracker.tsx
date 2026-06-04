"use client";

import { useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { useAppSelector } from "@/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreatePeriodLogMutation,
  useGetPeriodLogsQuery,
  useUpdatePeriodLogMutation,
  useDeletePeriodLogMutation,
  type PeriodLog,
} from "@/redux/api/periodLogApi";

const FLOW_OPTIONS = [
  { value: "light", emoji: "🩸" },
  { value: "medium", emoji: "🩸🩸" },
  { value: "heavy", emoji: "🩸🩸🩸" },
];
const SYMPTOM_OPTIONS = [
  { id: "cramps", emoji: "😣" },
  { id: "headache", emoji: "🤕" },
  { id: "bloating", emoji: "🎈" },
  { id: "fatigue", emoji: "😴" },
  { id: "nausea", emoji: "🤢" },
  { id: "backache", emoji: "🪑" },
  { id: "mood swings", emoji: "🎭" },
  { id: "breast tenderness", emoji: "💔" },
  { id: "acne", emoji: "😶" },
  { id: "cravings", emoji: "🍫" },
];

export default function PeriodTracker() {
  const user = useAppSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [cycleLength, setCycleLength] = useState("");
  const [flowIntensity, setFlowIntensity] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useGetPeriodLogsQuery(
    { limit: 10 },
    { skip: user?.gender !== "female" },
  );
  const [createLog] = useCreatePeriodLogMutation();
  const [updateLog] = useUpdatePeriodLogMutation();
  const [deleteLog] = useDeletePeriodLogMutation();

  if (user?.gender !== "female") return null;

  const logs: PeriodLog[] = data?.logs || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        cycleLength: cycleLength ? parseInt(cycleLength) : undefined,
        flowIntensity: flowIntensity || undefined,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
        notes: notes || undefined,
      };
      if (editId) {
        await updateLog({ id: editId, ...payload }).unwrap();
      } else {
        await createLog(payload).unwrap();
      }
      setOpen(false);
      setEditId(null);
      setEndDate("");
      setCycleLength("");
      setFlowIntensity("");
      setSelectedSymptoms([]);
      setNotes("");
    } catch {
      /* handled */
    }
  };

  const toggleSymptom = (s: string) =>
    setSelectedSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const openEdit = (log: PeriodLog) => {
    setEditId(log.id);
    setStartDate(log.startDate.split("T")[0]);
    setEndDate(log.endDate ? log.endDate.split("T")[0] : "");
    setCycleLength(log.cycleLength ? String(log.cycleLength) : "");
    setFlowIntensity(log.flowIntensity || "");
    setSelectedSymptoms(log.symptoms || []);
    setNotes(log.notes || "");
    setOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setCycleLength("");
    setFlowIntensity("");
    setSelectedSymptoms([]);
    setNotes("");
  };

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand-coral/15 text-brand-coral">
            <Calendar className="size-4" />
          </div>
          <h3 className="font-display text-sm font-semibold">Period Tracker</h3>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="xs" variant="outline">
              <Plus /> Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editId ? "Edit Period" : "Log Period"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field>
                <FieldLabel className="text-xs">Start Date</FieldLabel>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">End Date (optional)</FieldLabel>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel className="text-xs">Cycle Length (days, optional)</FieldLabel>
                <Input
                  type="number"
                  placeholder="28"
                  value={cycleLength}
                  onChange={(e) => setCycleLength(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">Flow Intensity</FieldLabel>
                <Select value={flowIntensity} onValueChange={setFlowIntensity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FLOW_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.emoji} {o.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel className="text-xs">Symptoms</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {SYMPTOM_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSymptom(s.id)}
                      className="rounded-full border px-2.5 py-1 text-xs transition-colors"
                      style={
                        selectedSymptoms.includes(s.id)
                          ? {
                              background: "var(--brand-teal)",
                              color: "white",
                              borderColor: "var(--brand-teal)",
                            }
                          : {
                              background: "var(--bg-subtle)",
                              color: "var(--muted-foreground)",
                              borderColor: "var(--border-default)",
                            }
                      }
                    >
                      {s.emoji} {s.id}
                    </button>
                  ))}
                </div>
              </Field>
              <Field>
                <FieldLabel className="text-xs">Notes</FieldLabel>
                <Input
                  placeholder="Any notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
              <Button type="submit" variant="gradient" className="w-full">
                Save Log
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-1.5">
        {isLoading ? (
          <div className="h-12 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
        ) : logs.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No periods logged yet</p>
        ) : (
          logs.slice(0, 5).map((log) => {
            const start = new Date(log.startDate).toLocaleDateString();
            const end = log.endDate ? new Date(log.endDate).toLocaleDateString() : null;
            const duration = log.endDate
              ? Math.round(
                  (new Date(log.endDate).getTime() - new Date(log.startDate).getTime()) /
                    (1000 * 60 * 60 * 24),
                ) + 1
              : null;
            return (
              <div
                key={log.id}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 transition-colors hover:bg-[var(--border-subtle)]"
                onClick={() => openEdit(log)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{end ? `${start} - ${end}` : start}</span>
                    {duration && (
                      <span className="text-xs text-muted-foreground">({duration}d)</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                    {log.flowIntensity && <span>{log.flowIntensity}</span>}
                    {log.symptoms?.length > 0 && (
                      <span>
                        · {log.symptoms.slice(0, 3).join(", ")}
                        {log.symptoms?.length > 3 && "..."}
                      </span>
                    )}
                    {log.cycleLength && <span>· cycle: {log.cycleLength}d</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteLog(log.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </GlassCard>
  );
}
