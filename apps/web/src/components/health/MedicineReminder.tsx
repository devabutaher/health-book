"use client";

import { useState, useEffect, useCallback } from "react";
import { Pill, Plus, X, Bell, BellOff, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
}
interface DoseRecord {
  date: string;
  medicineId: string;
  taken: boolean;
  takenAt?: string;
}

const STORAGE_KEY_MEDICINES = "healthbook_medicines";
const STORAGE_KEY_DOSES = "healthbook_doses";

function loadMedicines(): Medicine[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_MEDICINES) || "[]");
  } catch {
    return [];
  }
}
function loadDoses(): DoseRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_DOSES) || "[]");
  } catch {
    return [];
  }
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function MedicineReminder() {
  const [medicines, setMedicines] = useState<Medicine[]>(loadMedicines);
  const [doses, setDoses] = useState<DoseRecord[]>(loadDoses);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("08:00");
  const [notifEnabled] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window)
      return Notification.permission === "granted";
    return false;
  });

  useEffect(() => {
    if (medicines.length > 0)
      localStorage.setItem(STORAGE_KEY_MEDICINES, JSON.stringify(medicines));
  }, [medicines]);
  useEffect(() => {
    if (doses.length > 0) localStorage.setItem(STORAGE_KEY_DOSES, JSON.stringify(doses));
  }, [doses]);

  const today = todayStr();
  const isTaken = useCallback(
    (mid: string) => doses.some((d) => d.date === today && d.medicineId === mid && d.taken),
    [doses, today],
  );

  const markTaken = (mid: string) => {
    setDoses((prev) => {
      const idx = prev.findIndex((d) => d.date === today && d.medicineId === mid);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], taken: true, takenAt: new Date().toLocaleTimeString() };
        return next;
      }
      return [
        ...prev,
        { date: today, medicineId: mid, taken: true, takenAt: new Date().toLocaleTimeString() },
      ];
    });
    const med = medicines.find((m) => m.id === mid);
    toast.success(`Logged: ${med?.name || "Medicine"} taken`);
  };
  const undoTake = (mid: string) =>
    setDoses((prev) =>
      prev.map((d) =>
        d.date === today && d.medicineId === mid ? { ...d, taken: false, takenAt: undefined } : d,
      ),
    );

  const addMedicine = () => {
    if (!name.trim() || !dosage.trim() || !time) return;
    const med: Medicine = {
      id: crypto.randomUUID(),
      name: name.trim(),
      dosage: dosage.trim(),
      time,
    };
    setMedicines((prev) => [...prev, med]);
    setName("");
    setDosage("");
    setTime("08:00");
    setShowForm(false);
    toast.success("Medicine added!");
  };
  const removeMedicine = (id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    setDoses((prev) => prev.filter((d) => d.medicineId !== id));
  };

  const requestNotification = async () => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") await Notification.requestPermission();
  };

  useEffect(() => {
    requestNotification();
    const checkReminders = () => {
      if (typeof window === "undefined") return;
      if (medicines.length === 0) return;
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      for (const med of medicines) {
        const medMinutes = timeToMinutes(med.time);
        if (Math.abs(currentMinutes - medMinutes) <= 1 && !isTaken(med.id)) {
          const msg = `Time to take ${med.name} (${med.dosage})`;
          if (Notification.permission === "granted") {
            new Notification("Medicine Reminder", { body: msg, icon: "/favicon.ico" });
          } else {
            toast.info(msg);
          }
        }
      }
    };
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [medicines, isTaken]);

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-blue">
            <Pill className="size-4" />
          </div>
          <h3 className="font-display text-sm font-semibold">Medicine Reminder</h3>
        </div>
        <Button variant="outline" size="xs" onClick={() => setShowForm(true)}>
          <Plus /> Add
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-3 space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3">
              <FieldGroup className="gap-2">
                <Field>
                  <FieldLabel className="text-xs">Medicine Name</FieldLabel>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vitamin D"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-xs">Dosage</FieldLabel>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 1000 IU"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-xs">Time</FieldLabel>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </Field>
              </FieldGroup>
              <div className="flex justify-end gap-1.5">
                <Button variant="outline" size="xs" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button size="xs" onClick={addMedicine} disabled={!name.trim() || !dosage.trim()}>
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {medicines.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">No medicines added yet</p>
      ) : (
        <div className="space-y-1.5">
          {medicines.map((med) => {
            const taken = isTaken(med.id);
            return (
              <div
                key={med.id}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => (taken ? undoTake(med.id) : markTaken(med.id))}
                  className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                  style={
                    taken
                      ? {
                          background: "var(--brand-green)",
                          borderColor: "var(--brand-green)",
                          color: "white",
                        }
                      : {
                          borderColor: "var(--border-strong)",
                        }
                  }
                >
                  {taken && <Check className="size-3" strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-medium ${taken ? "text-muted-foreground line-through" : ""}`}
                  >
                    {med.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{med.dosage}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{med.time.slice(0, 5)}</span>
                  <button
                    type="button"
                    onClick={() => removeMedicine(med.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
        {notifEnabled ? (
          <>
            <Bell className="size-3 text-brand-green" />
            Notifications active
          </>
        ) : (
          <>
            <BellOff className="size-3 text-brand-amber" />
            Browser notifications off
          </>
        )}
      </div>
    </GlassCard>
  );
}
