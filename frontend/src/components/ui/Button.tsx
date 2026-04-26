import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`ui-button ui-button--${variant} ${className}`.trim()} {...props} />;
}

export function LinkButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: LinkProps & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <Link className={`ui-button ui-button--${variant} ${className}`.trim()} {...props}>
      {children}
    </Link>
  );
}
