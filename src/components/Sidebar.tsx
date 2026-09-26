import React from 'react';
import type { Student, ProjectorConfig, SeatVersion } from './types';
import { LuBook, LuUsers, LuBan, LuDices, LuRotateCcw, LuLoader } from 'react-icons/lu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface SidebarProps {
  showSidebar: boolean;
  matkul: string;
  setMatkul: (val: string) => void;
  kelas: string;
  setKelas: (val: string) => void;
  matkulOptions: { value: string; label: string }[];
  kelasOptions: { value: string; label: string }[];
  disabledSeats: Set<number>;
  toggleDisabledSeat: (seatNo: number) => void;
  eligibleStudents: Student[];
  isLoading: boolean;
  isOptionsLoading: boolean;
  isKelasLoading: boolean;
  handleGenerate: () => void;
  handleReset: () => void;
  totalSeats: number;
  projectorConfig: ProjectorConfig;
  setProjectorConfig: React.Dispatch<React.SetStateAction<ProjectorConfig>>;
  versions?: SeatVersion[];
  restoreVersion?: (v: SeatVersion) => void;
}

export default function Sidebar({
  showSidebar,
  matkul,
  setMatkul,
  kelas,
  setKelas,
  matkulOptions,
  kelasOptions,
  disabledSeats,
  toggleDisabledSeat,
  eligibleStudents,
  isLoading,
  isOptionsLoading,
  isKelasLoading,
  handleGenerate,
  handleReset,
  totalSeats,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${showSidebar ? "open" : "closed"}`}>
      <div className="sidebar-header min-h-8 pb-2 mb-3 flex items-center justify-between">
        <span className="font-semibold text-sm text-foreground">Generator Kursi</span>
      </div>

      {/* Matkul & Kelas */}
      <div className="sidebar-section flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="sidebar-label flex items-center gap-1.5 text-xs font-medium text-foreground/80">
            <LuBook className="size-3.5 text-muted-foreground" />
            <span>Mata Kuliah</span>
          </Label>
          <Select
            items={matkulOptions}
            value={matkul}
            onValueChange={(v) => {
              if (v) {
                setMatkul(v);
                setKelas(""); // Reset kelas so user must explicitly pick again
              }
            }}
            disabled={isOptionsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Pilih Mata Kuliah --" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Mata Kuliah</SelectLabel>
                {matkulOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="sidebar-label flex items-center gap-1.5 text-xs font-medium text-foreground/80">
            <LuUsers className="size-3.5 text-muted-foreground" />
            <span>Kelas</span>
          </Label>
          <Select
            items={kelasOptions}
            value={kelas}
            onValueChange={(v) => {
              if (v) setKelas(v);
            }}
            disabled={!matkul || isKelasLoading || isOptionsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Pilih Kelas --" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Kelas</SelectLabel>
                {kelasOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Disabled seats */}
      <div className="sidebar-section flex flex-col gap-2 mt-4">
        <div className="flex items-center justify-between">
          <Label className="sidebar-label flex items-center gap-1.5 text-xs font-medium text-foreground/80">
            <LuBan className="size-3.5 text-destructive" />
            <span>Meja tidak aktif</span>
          </Label>
          {disabledSeats.size > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
              {disabledSeats.size}
            </Badge>
          )}
        </div>
        <div className="seat-toggle-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.round(totalSeats / 10))}, 1fr)` }}>
          {Array.from({ length: totalSeats }, (_, i) => i + 1).map((n) => {
            const isDisabled = disabledSeats.has(n);
            return (
              <Button
                key={n}
                type="button"
                size="icon-xs"
                variant={isDisabled ? "destructive" : "outline"}
                className={`h-7 w-full text-xs font-mono transition-all ${
                  isDisabled ? "opacity-90" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => toggleDisabledSeat(n)}
                title={isDisabled ? `Meja ${n} dinonaktifkan (klik untuk aktifkan)` : `Meja ${n} aktif (klik untuk matikan)`}
              >
                {n}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Generate */}
      <div className="sidebar-section flex flex-col gap-2 mt-4">
        <Button
          variant="default"
          size="default"
          onClick={handleGenerate}
          disabled={!matkul || !kelas || eligibleStudents.length === 0 || isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <>
              <LuLoader className="size-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <LuDices className="size-4" />
              <span>Generate Acak</span>
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="default"
          onClick={handleReset}
          className="w-full gap-2 text-muted-foreground hover:text-foreground"
        >
          <LuRotateCcw className="size-4" />
          <span>Reset</span>
        </Button>
      </div>
    </aside>
  );
}
