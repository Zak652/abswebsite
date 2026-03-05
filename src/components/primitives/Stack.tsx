import type { ElementType, ReactNode, CSSProperties } from "react";

type Direction = "row" | "col";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";
type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

interface StackProps {
  direction?: Direction;
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const gapClasses: Record<Gap, string> = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
  16: "gap-16",
  20: "gap-20",
  24: "gap-24",
};

const alignClasses: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClasses: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export function Stack({
  direction = "col",
  gap = 4,
  align = "stretch",
  justify = "start",
  wrap = false,
  as: Tag = "div",
  className = "",
  style,
  children,
}: StackProps) {
  return (
    <Tag
      className={[
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap ? "flex-wrap" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
    </Tag>
  );
}
