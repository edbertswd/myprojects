import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  badge: string;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
};

export default function SectionHeader({ badge, icon, title, subtitle, align = "center", className }: Props) {
  return (
    <motion.div
      className={cn("mb-10 md:mb-14", align === "center" ? "text-center" : "text-left", className)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-dark">
        {icon && <span className="text-sage [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
        {badge}
      </span>
      <h2 className="display-lg mt-5 font-extrabold text-slate">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground md:text-lg">{subtitle}</p>}
    </motion.div>
  );
}
