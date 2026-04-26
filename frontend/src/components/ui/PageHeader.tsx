import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span className="breadcrumbs__item" key={`${item.label}-${index}`}>
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="page__header">
      <div>
        <Breadcrumbs items={breadcrumbs} />
        {eyebrow ? <span className="shell__eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="page__actions">{actions}</div> : null}
    </header>
  );
}
