import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS: { key: number; label: string; full: string }[] = [
  { key: 0, label: "Lun", full: "Lunes" },
  { key: 1, label: "Mar", full: "Martes" },
  { key: 2, label: "Mié", full: "Miércoles" },
  { key: 3, label: "Jue", full: "Jueves" },
  { key: 4, label: "Vie", full: "Viernes" },
  { key: 5, label: "Sáb", full: "Sábado" },
  { key: 6, label: "Dom", full: "Domingo" },
];

const generateTimes = () => {
  const arr: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      arr.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return arr; // 00:00 .. 23:30 (48 items)
};

const TIMES = generateTimes();

export type WeeklySelection = Record<number, Set<string>>; // dayKey -> times

interface TimeSlotGridProps {
  mode: "weekly" | "date";
  selectedDays: number[]; // only used in weekly
  weeklySelection: WeeklySelection;
  dateSelection: Set<string>;
  onToggle: (dayKey: number, time: string) => void;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  mode,
  selectedDays,
  weeklySelection,
  dateSelection,
  onToggle,
}) => {
  const dayColumns = mode === "weekly" ? [0] : [0];

  return (
    <div className="w-full overflow-auto border rounded-md">
      <div
        className="min-w-[880px] grid"
        style={{
          gridTemplateColumns: `120px repeat(${dayColumns.length}, minmax(120px, 1fr))`,
        }}
      >
        <div className="sticky left-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 py-2 text-sm font-medium text-muted-foreground">
          Hora
        </div>
        {dayColumns.map((dayKey, idx) => (
          <div
            key={`head-${dayKey}-${idx}`}
            className="border-b px-3 py-2 text-sm font-medium text-muted-foreground text-center"
          >
            {mode === "weekly" ? "Seleccionados" : "Seleccionado"}
          </div>
        ))}

        {TIMES.map((t) => (
          <React.Fragment key={t}>
            <div className="sticky left-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 py-2 text-xs text-muted-foreground">
              {t}
            </div>
            {dayColumns.map((dayKey, idx) => {
              const checked =
                mode === "weekly"
                  ? selectedDays.length > 0 && selectedDays.every((d) => weeklySelection[d]?.has(t))
                  : dateSelection.has(t);
              return (
                <label
                  key={`${t}-${dayKey}-${idx}`}
                  className="border-b px-2 py-1 flex items-center justify-center cursor-pointer select-none"
                  aria-label={`${mode === 'weekly' ? 'Días seleccionados' : 'Fecha seleccionada'} ${t}`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggle(dayKey, t)}
                    className="h-4 w-4"
                  />
                </label>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
