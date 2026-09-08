import { Input } from '@/components/ui/input';
import type { ComponentProps, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
export function Field({
  label,
  hint,
  ...props
}: ComponentProps<'input'> & { label: string; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={props.id ?? props.name}>{label}</label>
      <Input {...props} id={props.id ?? props.name} />
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}
export function FormError({ children }: { children: ReactNode }) {
  return children ? (
    <p className="error-text" role="alert">
      {children}
    </p>
  ) : null;
}
export function Loading({
  text = 'Loading public state...',
}: {
  text?: string;
}) {
  return (
    <div className="loading" role="status">
      <LoaderCircle size={20} className="spin" />
      {text}
    </div>
  );
}
