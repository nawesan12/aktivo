"use client";

import { useCallback } from "react";

interface AnalyticsDatePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

export function AnalyticsDatePicker({ startDate, endDate, onChange }: AnalyticsDatePickerProps) {
  const setPreset = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onChange({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
  }, [onChange]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {[
          { label: "7d", days: 7 },
          { label: "30d", days: 30 },
          { label: "90d", days: 90 },
        ].map((preset) => (
          <button
            key={preset.days}
            onClick={() => setPreset(preset.days)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
      {/* The two date inputs together are wider than a phone column, and this
          row is the only part of the picker that does not wrap. */}
      <div className="flex items-center gap-2 text-xs w-full sm:w-auto min-w-0">
        <input
          type="date"
          aria-label="Desde"
          value={startDate}
          onChange={(e) => onChange({ startDate: e.target.value, endDate })}
          className="bg-muted rounded-lg px-2 py-1.5 text-xs text-foreground border-none outline-none min-w-0 flex-1"
        />
        <span className="text-muted-foreground shrink-0">&mdash;</span>
        <input
          type="date"
          aria-label="Hasta"
          value={endDate}
          onChange={(e) => onChange({ startDate, endDate: e.target.value })}
          className="bg-muted rounded-lg px-2 py-1.5 text-xs text-foreground border-none outline-none min-w-0 flex-1"
        />
      </div>
    </div>
  );
}
