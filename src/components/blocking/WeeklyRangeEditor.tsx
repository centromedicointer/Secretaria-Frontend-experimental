import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Copy, ClipboardPaste } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RangeRows } from "./RangeRows";
const DAYS: { key: number; label: string; full: string }[] = [
  { key: 6, label: "Dom", full: "Domingo" },
  { key: 0, label: "Lun", full: "Lunes" },
  { key: 1, label: "Mar", full: "Martes" },
  { key: 2, label: "Mié", full: "Miércoles" },
  { key: 3, label: "Jue", full: "Jueves" },
  { key: 4, label: "Vie", full: "Viernes" },
  { key: 5, label: "Sáb", full: "Sábado" },
];

const generateTimes = () => {
  const arr: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      arr.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return arr; // 00:00 .. 23:30
};

const TIMES = generateTimes();

export type WeeklyRanges = Record<number, { enabled: boolean; ranges: Array<{ from: string; to: string }> }>;

interface WeeklyRangeEditorProps {
  value: WeeklyRanges;
  onChange: (next: WeeklyRanges) => void;
}

export const WeeklyRangeEditor: React.FC<WeeklyRangeEditorProps> = ({ value, onChange }) => {
  const handleToggleDay = (dayKey: number, enabled: boolean) => {
    const existing = value[dayKey] ?? { enabled: false, ranges: [] };
    const nextDay = enabled && existing.ranges.length === 0
      ? { enabled: true, ranges: [{ from: "09:00", to: "18:00" }] }
      : { ...existing, enabled };
    const next: WeeklyRanges = { ...value, [dayKey]: nextDay };
    onChange(next);
  };

  const addRange = (dayKey: number) => {
    const existing = value[dayKey] ?? { enabled: true, ranges: [] };
    const next: WeeklyRanges = {
      ...value,
      [dayKey]: { enabled: true, ranges: [...existing.ranges, { from: "09:00", to: "18:00" }] },
    };
    onChange(next);
  };

  const duplicateLastRange = (dayKey: number) => {
    const existing = value[dayKey] ?? { enabled: true, ranges: [] };
    if (existing.ranges.length === 0) {
      addRange(dayKey);
      return;
    }
    const last = existing.ranges[existing.ranges.length - 1];
    const next: WeeklyRanges = {
      ...value,
      [dayKey]: { enabled: true, ranges: [...existing.ranges, { ...last }] },
    };
    onChange(next);
  };
  const updateRange = (dayKey: number, idx: number, patch: Partial<{ from: string; to: string }>) => {
    const existing = value[dayKey] ?? { enabled: false, ranges: [] };
    const ranges = existing.ranges.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    const next: WeeklyRanges = { ...value, [dayKey]: { ...existing, ranges } };
    onChange(next);
  };

  const removeRange = (dayKey: number, idx: number) => {
    const existing = value[dayKey] ?? { enabled: false, ranges: [] };
    const ranges = existing.ranges.filter((_, i) => i !== idx);
    const next: WeeklyRanges = { ...value, [dayKey]: { ...existing, ranges } };
    onChange(next);
  };

  // Copiar bloques a otros días
  const [pasteOpen, setPasteOpen] = React.useState<number | null>(null);
  const [pasteTargets, setPasteTargets] = React.useState<Set<number>>(new Set());
  const [pasteRangeIdx, setPasteRangeIdx] = React.useState<number | null>(null); // null = copiar todos los bloques del día
  const toggleTarget = (k: number) => {
    setPasteTargets((prev) => {
      const s = new Set(prev);
      if (s.has(k)) s.delete(k); else s.add(k);
      return s;
    });
  };
  const applyPaste = () => {
    if (pasteOpen === null) return;
    const src = value[pasteOpen] ?? { enabled: false, ranges: [] };
    const sources = pasteRangeIdx !== null && src.ranges[pasteRangeIdx] ? [src.ranges[pasteRangeIdx]] : src.ranges;
    let next: WeeklyRanges = { ...value };
    for (const k of pasteTargets) {
      if (k === pasteOpen) continue;
      const existing = next[k] ?? { enabled: false, ranges: [] };
      const merged = [...existing.ranges];
      for (const r of sources) {
        if (!merged.some((x) => x.from === r.from && x.to === r.to)) {
          merged.push({ ...r });
        }
      }
      next[k] = { enabled: true, ranges: merged };
    }
    onChange(next);
    setPasteOpen(null);
    setPasteTargets(new Set());
    setPasteRangeIdx(null);
  };

  return (
    <div className="space-y-3">
      {DAYS.map((d) => {
        const day = value[d.key] ?? { enabled: false, ranges: [] };
        const disabled = !day.enabled;
        return (
          <div key={d.key} className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-3 border-b pb-3 last:border-b-0">
            <div className="flex items-center gap-3">
              <Switch id={`day-${d.key}`} checked={day.enabled} onCheckedChange={(v) => handleToggleDay(d.key, Boolean(v))} />
              <Label htmlFor={`day-${d.key}`} className="text-sm font-medium">
                {d.full}
              </Label>
            </div>

            <div className="space-y-2">
              {day.ranges.length === 0 && (
                <div className="text-sm text-muted-foreground">{disabled ? "Desactivado" : "Sin bloques. Agrega uno abajo."}</div>
              )}

              <RangeRows
                ranges={day.ranges}
                disabled={disabled}
                onAdd={() => addRange(d.key)}
                onUpdate={(idx, patch) => updateRange(d.key, idx, patch)}
                onRemove={(idx) => removeRange(d.key, idx)}
                onDuplicate={() => duplicateLastRange(d.key)}
                onCopyRange={(idx) => { setPasteTargets(new Set()); setPasteRangeIdx(idx); setPasteOpen(d.key); }}
              />

            </div>
          </div>
        );
      })}
      <Dialog open={pasteOpen !== null} onOpenChange={(o) => { if (!o) { setPasteOpen(null); setPasteTargets(new Set()); setPasteRangeIdx(null); } }}>
        <DialogContent className="sm:max-w-[420px] z-[70]">
          <DialogHeader>
            <DialogTitle>Copiar bloques a otros días</DialogTitle>
            <DialogDescription>Elige los días destino. Se mantendrán los bloques existentes.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {DAYS.map((day) => (
              <label key={day.key} className="flex items-center gap-2">
                <Checkbox
                  id={`paste-${day.key}`}
                  checked={pasteTargets.has(day.key)}
                  onCheckedChange={() => toggleTarget(day.key)}
                  disabled={pasteOpen === day.key}
                />
                <span>{day.full}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => { setPasteOpen(null); setPasteTargets(new Set()); }}>Cancelar</Button>
            <Button type="button" onClick={applyPaste} disabled={pasteTargets.size === 0}>Aplicar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
