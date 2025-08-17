import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { WeeklyRangeEditor, WeeklyRanges } from "./blocking/WeeklyRangeEditor";
import { RangeRows } from "./blocking/RangeRows";
import { formatInTimeZone } from "date-fns-tz";

const MEXICO_TIMEZONE = 'America/Mexico_City';

export type BlockSlotsData =
  | { mode: 'weekly'; days: { [dayKey: number]: string[] }; description?: string }
  | { mode: 'date'; date: string; times: string[]; description?: string };

interface BlockTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BlockSlotsData) => Promise<void> | void;
  selectedDate?: Date;
  isLoading?: boolean;
  initialWeeklyDays?: { [dayKey: number]: string[] };
  initialDateTimes?: { date: string; times: string[] };
}

export const BlockTimeModal: React.FC<BlockTimeModalProps> = ({
  open,
  onOpenChange,
  onSave,
  selectedDate,
  isLoading = false,
  initialWeeklyDays,
  initialDateTimes,
}) => {
  // State: mode and shared fields
  const [mode, setMode] = React.useState<'weekly' | 'date'>('date');
  const [dateStr, setDateStr] = React.useState<string>(selectedDate ? formatInTimeZone(selectedDate, MEXICO_TIMEZONE, 'yyyy-MM-dd') : '');
  const [description, setDescription] = React.useState<string>('');

  // Weekly state as ranges por día (Lun-Dom)
  const createEmptyWeeklyRanges = (): WeeklyRanges => ({
    0: { enabled: false, ranges: [] }, // Lunes
    1: { enabled: false, ranges: [] }, // Martes
    2: { enabled: false, ranges: [] }, // Miércoles
    3: { enabled: false, ranges: [] }, // Jueves
    4: { enabled: false, ranges: [] }, // Viernes
    5: { enabled: false, ranges: [] }, // Sábado
    6: { enabled: false, ranges: [] }, // Domingo
  });
  const [weeklyRanges, setWeeklyRanges] = React.useState<WeeklyRanges>(createEmptyWeeklyRanges());

  // Date-specific state (as ranges)
  const [dateRanges, setDateRanges] = React.useState<Array<{ from: string; to: string }>>([]);

  React.useEffect(() => {
    if (!open) return;

    const def = selectedDate ? formatInTimeZone(selectedDate, MEXICO_TIMEZONE, 'yyyy-MM-dd') : '';
    const hasDateTimes = initialDateTimes && initialDateTimes.date === def && (initialDateTimes.times?.length || 0) > 0;
    setMode('date');
    setDescription('');
    setDateStr(def);

    // Inicializar semanal desde props (slots -> rangos)
    const toMinutes = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m;
    };
    const toTime = (mins: number) => {
      const h = String(Math.floor(mins / 60)).padStart(2, '0');
      const m = String(mins % 60).padStart(2, '0');
      return `${h}:${m}`;
    };
    const slotsToRanges = (slots: string[]) => {
      const sorted = Array.from(new Set(slots)).sort();
      const ranges: Array<{ from: string; to: string }> = [];
      if (sorted.length === 0) return ranges;
      let start = toMinutes(sorted[0]);
      let endExclusive = start + 30;
      for (let i = 1; i < sorted.length; i++) {
        const cur = toMinutes(sorted[i]);
        if (cur === endExclusive) {
          endExclusive += 30;
        } else {
          ranges.push({ from: toTime(start), to: toTime(endExclusive) });
          start = cur;
          endExclusive = cur + 30;
        }
      }
      ranges.push({ from: toTime(start), to: toTime(endExclusive) });
      return ranges;
    };

    const nextWeekly: WeeklyRanges = {
      0: { enabled: false, ranges: [] },
      1: { enabled: false, ranges: [] },
      2: { enabled: false, ranges: [] },
      3: { enabled: false, ranges: [] },
      4: { enabled: false, ranges: [] },
      5: { enabled: false, ranges: [] },
      6: { enabled: false, ranges: [] },
    };
    for (let d = 0; d <= 6; d++) {
      const slots = initialWeeklyDays?.[d] ?? [];
      const ranges = slotsToRanges(slots);
      nextWeekly[d] = { enabled: ranges.length > 0, ranges };
    }
    setWeeklyRanges(nextWeekly);

    // Inicializar rangos por fecha si coincide con la fecha por defecto
    const dateTimes = initialDateTimes && initialDateTimes.date === def ? initialDateTimes.times : [];
    setDateRanges(slotsToRanges(dateTimes));
  }, [open, selectedDate, initialWeeklyDays, initialDateTimes]);


  const handleSubmit = async () => {
    try {
      if (mode === 'weekly') {
        const toMinutes = (s: string) => {
          const [h, m] = s.split(":").map(Number);
          return h * 60 + m;
        };
        const toTime = (mins: number) => {
          const h = String(Math.floor(mins / 60)).padStart(2, '0');
          const m = String(mins % 60).padStart(2, '0');
          return `${h}:${m}`;
        };
        const expandRange = (from: string, to: string) => {
          const start = toMinutes(from);
          const end = toMinutes(to);
          const out: string[] = [];
          if (!(end > start)) return out;
          for (let t = start; t < end; t += 30) out.push(toTime(t));
          return out;
        };

        const days: { [k: number]: string[] } = {};
        for (let d = 0; d <= 6; d++) {
          const day = weeklyRanges[d];
          if (!day?.enabled) continue;
          const set = new Set<string>();
          for (const r of day.ranges) {
            for (const t of expandRange(r.from, r.to)) set.add(t);
          }
          if (set.size) days[d] = Array.from(set).sort();
        }
        await onSave({ mode: 'weekly', days, description });
      } else {
        if (!dateStr) return;
        // Expandir rangos a slots de 30min
        const toMinutes = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
        const toTime = (mins: number) => { const h = String(Math.floor(mins / 60)).padStart(2, '0'); const m = String(mins % 60).padStart(2, '0'); return `${h}:${m}`; };
        const expandRange = (from: string, to: string) => {
          const start = toMinutes(from); const end = toMinutes(to);
          const out: string[] = []; if (!(end > start)) return out;
          for (let t = start; t < end; t += 30) out.push(toTime(t)); return out;
        };
        const times = dateRanges.flatMap((r) => expandRange(r.from, r.to)).sort();
        await onSave({ mode: 'date', date: dateStr, times, description });
      }
      onOpenChange(false);
    } catch {
      // el padre maneja toasts
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px] md:max-w-[980px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Bloquear horarios</DialogTitle>
          <DialogDescription>
            Selecciona bloques de tiempo (30 min de resolución). Aplica como plantilla semanal o por fecha específica.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          {/* Columna izquierda: controles */}
          <aside className="space-y-4">
            {/* Selector de modo */}
            <div>
              <RadioGroup
                className="flex md:flex-col items-start gap-3"
                value={mode}
                onValueChange={(v) => setMode(v as 'weekly' | 'date')}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="m-weekly" value="weekly" />
                  <label htmlFor="m-weekly" className="text-sm">Recurrente (semanal)</label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="m-date" value="date" />
                  <label htmlFor="m-date" className="text-sm">Fecha específica</label>
                </div>
              </RadioGroup>
            </div>

            {mode === 'weekly' ? null : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha</label>
                <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Motivo (opcional)</label>
              <Textarea rows={3} placeholder="Ej. Reunión, mantenimiento, etc." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="flex justify-end md:justify-start gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar bloqueo'}
              </Button>
            </div>
          </aside>

          {/* Columna derecha: contenido principal */}
          <main className="min-h-[300px]">
            <div className="rounded-md border">
              <div className="max-h-[50vh] overflow-auto p-3 md:p-4">
                {mode === 'weekly' ? (
                  <WeeklyRangeEditor value={weeklyRanges} onChange={setWeeklyRanges} />
                ) : (
                  <div className="space-y-2">
                    <RangeRows
                      ranges={dateRanges}
                      disabled={false}
                      onAdd={() => setDateRanges((prev) => [...prev, { from: "09:00", to: "18:00" }])}
                      onUpdate={(idx, patch) => setDateRanges((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))}
                      onRemove={(idx) => setDateRanges((prev) => prev.filter((_, i) => i !== idx))}
                      onDuplicate={(idx) => setDateRanges((prev) => {
                        if (prev.length === 0) return [{ from: "09:00", to: "18:00" }];
                        const last = prev[Math.min(idx, prev.length - 1)];
                        return [...prev, { ...last }];
                      })}
                    />
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
};
