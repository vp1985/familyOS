import * as React from "react";
import { cn } from "@/lib/utils";

type FormFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function FormField({ label, hint, className, id, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replaceAll(" ", "-");

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={fieldId}>
      {label}
      <input
        id={fieldId}
        className={cn(
          "min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}
