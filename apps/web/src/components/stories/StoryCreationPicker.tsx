"use client";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { BarChart3, ChevronRight, HelpCircle, Image, Type, X } from "lucide-react";

const options: {
  type: "media" | "text" | "quiz" | "poll";
  icon: typeof Image;
  label: string;
  desc: string;
  gradient: string;
  bg: string;
  border: string;
  iconColor: string;
}[] = [
  {
    type: "media",
    icon: Image,
    label: "Photo / Video",
    desc: "Share a moment",
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/15",
    border: "border-blue-500/20 hover:border-blue-500/40",
    iconColor: "text-blue-300",
  },
  {
    type: "text",
    icon: Type,
    label: "Text Story",
    desc: "Express with words",
    gradient: "from-purple-500 to-pink-500",
    bg: "bg-purple-500/10 hover:bg-purple-500/15",
    border: "border-purple-500/20 hover:border-purple-500/40",
    iconColor: "text-purple-300",
  },
  {
    type: "quiz",
    icon: HelpCircle,
    label: "Quiz",
    desc: "Test your friends",
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/10 hover:bg-amber-500/15",
    border: "border-amber-500/20 hover:border-amber-500/40",
    iconColor: "text-amber-300",
  },
  {
    type: "poll",
    icon: BarChart3,
    label: "Poll",
    desc: "Get opinions",
    gradient: "from-teal-500 to-green-500",
    bg: "bg-teal-500/10 hover:bg-teal-500/15",
    border: "border-teal-500/20 hover:border-teal-500/40",
    iconColor: "text-teal-300",
  },
];

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

export function StoryCreationPicker({
  onSelect,
  onClose,
}: {
  onSelect: (type: "media" | "text" | "quiz" | "poll") => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} aria-describedby={undefined}>
        <DialogTitle className="sr-only">Create a Story</DialogTitle>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/50 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <h2 className="mb-1 text-lg font-bold text-white">Create a Story</h2>
        <p className="mb-5 text-sm text-white/40">Choose what to share</p>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-2.5"
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.type}
                variants={staggerItem}
                onClick={() => onSelect(opt.type)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                  opt.bg,
                  opt.border,
                )}
              >
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
                    opt.gradient,
                  )}
                >
                  <Icon className="size-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-white/45">{opt.desc}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-white/20" />
              </motion.button>
            );
          })}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
