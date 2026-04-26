import type { ReactNode } from "react";

type StatusTone = "info" | "success" | "warning" | "danger";

export function StatusBanner({
  tone = "info",
  title,
  children,
  actions,
}: {
  tone?: StatusTone;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={`status-banner status-banner--${tone}`}>
      <div>
        {title ? <strong>{title}</strong> : null}
        <div className="status-banner__body">{children}</div>
      </div>
      {actions ? <div className="status-banner__actions">{actions}</div> : null}
    </div>
  );
}
