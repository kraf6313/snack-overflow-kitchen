import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children, onClick, type = "button", variant = "primary", className = "", disabled,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit"; variant?: "primary" | "ghost" | "danger" | "soft"; className?: string; disabled?: boolean;
}) {
  const styles = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    ghost: "bg-transparent hover:bg-secondary text-foreground",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
    soft: "bg-secondary text-secondary-foreground hover:bg-accent",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full px-3 py-2 rounded-xl bg-input/40 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return <select {...props} className={`w-full px-3 py-2 rounded-xl bg-input/40 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm ${props.className ?? ""}`}>{props.children}</select>;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full px-3 py-2 rounded-xl bg-input/40 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm ${props.className ?? ""}`} />;
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{children}</label>;
}

export function Badge({ children, tone = "leaf" }: { children: ReactNode; tone?: "leaf" | "tomato" | "butter" | "muted" }) {
  const tones = {
    leaf: "bg-leaf/20 text-primary",
    tomato: "bg-tomato/20 text-tomato",
    butter: "bg-butter/40 text-foreground",
    muted: "bg-muted text-muted-foreground",
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, emoji, subtitle, action }: { title: string; emoji: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
          <span>{emoji}</span> {title}
        </h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
