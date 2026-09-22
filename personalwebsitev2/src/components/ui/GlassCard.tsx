import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLDivElement> & {
  strong?: boolean;
  hover?: boolean;
};

const GlassCard = forwardRef<HTMLDivElement, Props>(function GlassCard(
  { className, strong = false, hover = false, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl",
        strong ? "glass-strong" : "glass",
        hover && "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-hover",
        className
      )}
      {...rest}
    />
  );
});

export default GlassCard;
