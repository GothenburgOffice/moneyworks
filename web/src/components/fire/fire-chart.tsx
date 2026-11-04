"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { FireFormatters } from "./fire-format";

type Props = {
  values: number[];
  startAge: number;
  endAge: number;
  title: string;
  description: string;
  currency: string;
  ageLabel: string;
  target: number | null;
  targetLabel: string;
  format: FireFormatters;
};

const HEIGHT = 270;

export function FireChart({
  values,
  startAge,
  endAge,
  title,
  description,
  currency,
  ageLabel,
  target,
  targetLabel,
  format,
}: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(560);

  // The chart is drawn in CSS pixels so labels keep their size on every screen.
  useLayoutEffect(() => {
    const element = svg.current;
    if (!element) return;
    const measure = () => setWidth(Math.max(240, element.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const left = 70;
  const right = width - 12;
  const peak = values.reduce(
    (maximum, value) => Math.max(maximum, value),
    Math.max(1, target ?? 0),
  );
  const maximum = peak <= Number.MAX_VALUE / 1.1 ? peak * 1.1 : peak;
  const duration = endAge - startAge;
  const x = (age: number) =>
    duration === 0 ? (left + right) / 2 : left + ((age - startAge) / duration) * (right - left);
  const y = (value: number) => 220 - (Math.max(0, value) / maximum) * 190;
  const labelWidth =
    Math.max(format.number(startAge).length, format.number(endAge).length) * 7 + 18;
  const steps = Math.min(4, duration, Math.max(1, Math.floor((right - left) / labelWidth)));
  const grid = [0, 1, 2, 3, 4].map((i) => (maximum * i) / 4);
  const ages = Array.from({ length: steps + 1 }, (_, i) =>
    steps === 0 ? startAge : Math.round(startAge + (duration * i) / steps),
  );
  const anchor = (i: number) =>
    duration === 0 ? "middle" : i === 0 ? "start" : i === steps ? "end" : "middle";

  return (
    <svg ref={svg} viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={title} data-fire-chart>
      <title>{title}</title>
      <desc>{`${description} ${ageLabel}: ${startAge}–${endAge}.`}</desc>
      {grid.map((value, i) => (
        <g key={i}>
          <line x1={left} x2={right} y1={y(value)} y2={y(value)} className="fire-chart-grid" />
          <text x={left - 10} y={y(value) + 4} textAnchor="end" className="fire-chart-label">
            {format.axis(value)}
          </text>
        </g>
      ))}
      {ages.map((age, i) => (
        <text key={i} x={x(age)} y={245} textAnchor={anchor(i)} className="fire-chart-label">
          {format.number(age)}
        </text>
      ))}
      <text x={left} y={15} className="fire-chart-label">
        {currency}
      </text>
      <text x={right} y={265} textAnchor="end" className="fire-chart-label">
        {ageLabel}
      </text>
      {target !== null && (
        <>
          <line x1={left} x2={right} y1={y(target)} y2={y(target)} className="fire-chart-target" />
          <text x={right} y={y(target) - 8} textAnchor="end" className="fire-chart-label">
            {targetLabel}
          </text>
        </>
      )}
      <polyline
        points={values.map((value, index) => `${x(startAge + index)},${y(value)}`).join(" ")}
        className="fire-chart-line"
        fill="none"
        strokeWidth={2.5}
        strokeDasharray="6 4"
      />
      {values.length === 1 && (
        <circle cx={x(startAge)} cy={y(values[0])} r={3.5} className="fire-chart-point" />
      )}
    </svg>
  );
}
