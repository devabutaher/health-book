"use client";

import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { HEALTH_TEMPLATES, TEMPLATE_ORDER, getTemplate } from "./templates";

export default function TemplateSelector({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Sparkles className="size-5 text-brand-teal" />
            Log Your Health
          </DialogTitle>
          <DialogDescription>
            Pick a template to start tracking. You can edit details next.
          </DialogDescription>
        </DialogHeader>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid gap-2.5 py-2"
        >
          {TEMPLATE_ORDER.map((key) => {
            const t = getTemplate(key);
            return (
              <motion.button
                key={key}
                variants={staggerItem}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelect(key);
                  onOpenChange(false);
                }}
                className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 text-left transition-all hover:border-[var(--border-strong)]"
                style={{
                  boxShadow: `0 1px 0 0 var(--border-subtle) inset, 0 4px 16px -10px ${t.glow}`,
                  borderColor: `color-mix(in oklch, ${t.accent} 20%, transparent)`,
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1 rounded-l-2xl transition-all group-hover:w-1.5"
                  style={{ background: t.accent }}
                />
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: `color-mix(in oklch, ${t.accent} 18%, transparent)` }}
                >
                  {t.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{t.label}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
                </div>
                <Plus className="size-4 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.button>
            );
          })}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export { HEALTH_TEMPLATES, getTemplate };
