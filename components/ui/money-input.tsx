import { FormField } from "@/components/ui/form-field";

type MoneyInputProps = Omit<React.ComponentProps<typeof FormField>, "type" | "inputMode" | "step">;

export function MoneyInput(props: MoneyInputProps) {
  return <FormField inputMode="decimal" step="0.01" type="number" {...props} />;
}
