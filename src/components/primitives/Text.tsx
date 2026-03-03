import type { ElementType, ReactNode } from "react";

type TextVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body-lg"
  | "body"
  | "body-sm"
  | "caption"
  | "mono";

type TextColor =
  | "primary"
  | "secondary"
  | "muted"
  | "subtle"
  | "accent"
  | "white"
  | "inherit";

interface TextProps {
  variant?: TextVariant;
  color?: TextColor;
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<TextVariant, string> = {
  display: "text-6xl md:text-7xl font-heading font-bold tracking-tight",
  h1: "text-4xl md:text-5xl font-heading font-bold tracking-tight",
  h2: "text-3xl md:text-4xl font-heading font-bold",
  h3: "text-2xl font-heading font-bold",
  h4: "text-lg font-heading font-semibold",
  "body-lg": "text-xl leading-relaxed",
  body: "text-base leading-relaxed",
  "body-sm": "text-sm leading-relaxed",
  caption: "text-xs",
  mono: "text-sm font-mono",
};

const colorClasses: Record<TextColor, string> = {
  primary: "text-neutral-900",
  secondary: "text-neutral-700",
  muted: "text-neutral-500",
  subtle: "text-neutral-400",
  accent: "text-accent-500",
  white: "text-white",
  inherit: "",
};

const defaultTags: Record<TextVariant, ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  "body-lg": "p",
  body: "p",
  "body-sm": "p",
  caption: "span",
  mono: "span",
};

export function Text({
  variant = "body",
  color = "primary",
  as,
  children,
  className = "",
}: TextProps) {
  const Tag = as ?? defaultTags[variant];
  return (
    <Tag
      className={[variantClasses[variant], colorClasses[color], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
