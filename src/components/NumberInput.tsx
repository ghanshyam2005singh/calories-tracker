"use client";

import { useEffect, useRef, useState } from "react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  step?: number | string;
  min?: number;
  disabled?: boolean;
  placeholder?: string;
}

// A plain <input type="number"> bound directly to a number in React state
// mangles input like "46" -> "046" after clearing the field, because the
// DOM's in-progress text and the React-controlled numeric value fight each
// other on every keystroke. This keeps its own text buffer while focused,
// only reconciling with the external numeric value on blur or when it
// changes from the outside (e.g. an auto-calculated goal).
export default function NumberInput({
  value,
  onChange,
  className,
  step,
  min,
  disabled,
  placeholder,
}: NumberInputProps) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <input
      type="number"
      inputMode="decimal"
      className={className}
      step={step}
      min={min}
      disabled={disabled}
      placeholder={placeholder}
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setText(String(value));
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === "" || raw === "-") return;
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) onChange(parsed);
      }}
    />
  );
}
