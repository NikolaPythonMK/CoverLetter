import * as React from "react";
import { cn } from "@/components/utils/cn";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn("min-h-[120px] w-full rounded-md border px-3 py-2 text-sm", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";
