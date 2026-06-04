"use client";

import { useState } from "react";
import { AlertTriangle, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetHealthLogsQuery } from "@/redux/api/healthLogApi";
import { Button } from "@/components/ui/button";

export default function StreakAtRiskAlert() {
  const { data } = useGetHealthLogsQuery({ limit: 1 });
  const [now] = useState(() => new Date());
  const hour = now.getHours();
  const logs = data?.logs;
  const latest = logs?.length ? new Date(logs[0].date) : null;
  const todayStr = now.toDateString();
  const latestStr = latest?.toDateString();
  const show = !latest ? hour >= 20 : latestStr !== todayStr && hour >= 20;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center gap-3 rounded-2xl border border-brand-amber/30 bg-gradient-to-r from-brand-amber/10 to-brand-coral/10 p-3.5 text-sm"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-amber/20 text-brand-amber">
            <AlertTriangle className="size-4" />
          </div>
          <span className="flex-1 font-medium">
            You haven&apos;t logged any health data today. Log something to keep your streak alive!
          </span>
          <Button size="xs" variant="gradient">
            <Activity /> Log now
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
