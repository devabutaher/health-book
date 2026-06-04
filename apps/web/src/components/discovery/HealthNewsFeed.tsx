"use client";

import { useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { useGetNewsQuery } from "@/redux/api/newsApi";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

const categories = [
  { id: "", label: "All" },
  { id: "fitness", label: "Fitness" },
  { id: "nutrition", label: "Nutrition" },
  { id: "mental_health", label: "Mental Health" },
  { id: "general", label: "General" },
];

export function HealthNewsFeed() {
  const [category, setCategory] = useState("");
  const { data: articles, isLoading } = useGetNewsQuery(category || undefined);

  return (
    <div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              category === cat.id
                ? "bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
      ) : !articles || articles.length === 0 ? (
        <GlassCard variant="subtle" className="flex flex-col items-center py-16 text-center">
          <Newspaper className="mb-2 size-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No news articles found</p>
        </GlassCard>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {articles.map((article) => (
            <motion.a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={staggerItem}
              className="group rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 backdrop-blur-xl transition-all hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lg)]"
            >
              <div className="flex h-full flex-col">
                <div className="mb-2">
                  <span className="inline-block rounded-full bg-brand-teal/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-teal">
                    {article.source}
                  </span>
                </div>
                <h3 className="flex-1 text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-brand-teal">
                  {article.title}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                  <ExternalLink className="size-3.5 text-[var(--text-muted)] transition-colors group-hover:text-brand-teal" />
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      )}
    </div>
  );
}
