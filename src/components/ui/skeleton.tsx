import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(clsx("animate-pulse rounded-md bg-[#18181B]", className))}
      {...props}
    />
  );
}
