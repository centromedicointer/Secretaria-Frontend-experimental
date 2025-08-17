import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Copy, ClipboardPaste } from "lucide-react";

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

export interface RangeRowsProps {
  ranges: Array<{ from: string; to: string }>;
  disabled?: boolean;
  onAdd: () => void;
  onUpdate: (idx: number, patch: Partial<{ from: string; to: string }>) => void;
  onRemove: (idx: number) => void;
  onDuplicate: (idx: number) => void;
  onCopyRange?: (idx: number) => void; // opcional (solo semanal)
}

export const RangeRows: React.FC<RangeRowsProps> = ({
  ranges,
  disabled = false,
  onAdd,
  onUpdate,
  onRemove,
  onDuplicate,
  onCopyRange,
}) => {
  return (
    <div className="space-y-2">
      {ranges.length === 0 && (
        <div className="text-sm text-muted-foreground">{disabled ? "Desactivado" : "Sin bloques. Agrega uno abajo."}</div>
      )}

      {ranges.map((r, idx) => (
        <div key={idx} className={`flex items-center gap-2 flex-nowrap ${disabled ? "opacity-60" : ""}`}>
          <span className="text-sm">Bloquear de</span>
          <Select
            value={r.from}
            onValueChange={(val) => {
              const fromIndex = TIMES.indexOf(val);
              const toIndex = TIMES.indexOf(r.to);
              if (toIndex !== -1 && fromIndex !== -1 && fromIndex >= toIndex && fromIndex + 1 < TIMES.length) {
                onUpdate(idx, { from: val, to: TIMES[fromIndex + 1] });
              } else {
                onUpdate(idx, { from: val });
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-[100px]"><SelectValue placeholder="00:00" /></SelectTrigger>
            <SelectContent>
              {TIMES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm">a</span>

          <Select
            value={r.to}
            onValueChange={(val) => {
              const toIndex = TIMES.indexOf(val);
              const fromIndex = TIMES.indexOf(r.from);
              if (fromIndex !== -1 && toIndex !== -1 && toIndex <= fromIndex && fromIndex + 1 < TIMES.length) {
                onUpdate(idx, { to: TIMES[fromIndex + 1] });
              } else {
                onUpdate(idx, { to: val });
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-[100px]"><SelectValue placeholder="00:30" /></SelectTrigger>
            <SelectContent>
              {TIMES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(idx)} disabled={disabled} aria-label="Eliminar bloque">
            <Trash2 className="h-4 w-4" />
          </Button>

          {onCopyRange && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onCopyRange(idx)}
              disabled={disabled}
              aria-label="Copiar este bloque a otros días"
            >
              <ClipboardPaste className="h-4 w-4" />
            </Button>
          )}

          {idx === 0 && (
            <>
              <Button type="button" variant="ghost" size="icon" onClick={onAdd} disabled={disabled} aria-label="Añadir bloque">
                <Plus className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onDuplicate(idx)} disabled={disabled || ranges.length === 0} aria-label="Duplicar último bloque">
                <Copy className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
