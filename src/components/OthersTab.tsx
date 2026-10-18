import React from "react";
import type { SeatVersion, SeatData, TabId } from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { LuHistory, LuTrash2, LuCheck } from "react-icons/lu";

interface OthersTabProps {
  versions: SeatVersion[];
  restoreVersion: (v: SeatVersion) => void;
  clearVersions?: () => void;
  setActiveTab?: (tab: TabId) => void;
  currentMatkul?: string;
  currentKelas?: string;
  currentSeats?: SeatData[];
}

export default function OthersTab({
  versions,
  restoreVersion,
  clearVersions,
  setActiveTab,
  currentMatkul,
  currentKelas,
  currentSeats,
}: OthersTabProps) {
  const handleRestore = (v: SeatVersion) => {
    restoreVersion(v);
    if (setActiveTab) {
      setActiveTab("seats");
    }
  };

  const handleClear = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat generate?")) {
      clearVersions?.();
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <LuHistory className="size-4 text-muted-foreground" />
            <span>Riwayat Generate Kursi</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mencatat hingga 20 versi generate terakhir (otomatis tersimpan selama 24 jam).
          </p>
        </div>
        {clearVersions && versions.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Hapus seluruh riwayat generate tersimpan"
            aria-label="Hapus seluruh riwayat generate"
          >
            <LuTrash2 className="size-3.5" />
            <span>Hapus Semua</span>
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-36 text-xs font-medium text-muted-foreground">Waktu</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Mata Kuliah</TableHead>
              <TableHead className="w-36 text-xs font-medium text-muted-foreground">Kelas</TableHead>
              <TableHead className="w-40 text-xs font-medium text-muted-foreground">Kursi Terisi</TableHead>
              <TableHead className="w-32 text-right text-xs font-medium text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!versions || versions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  Belum ada riwayat generate tersimpan.
                </TableCell>
              </TableRow>
            ) : (
              versions.map((v) => {
                const date = new Date(v.timestamp);
                const isToday = new Date().toDateString() === date.toDateString();
                const timeStr = isToday
                  ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                  : `${date.toLocaleDateString([], { day: "2-digit", month: "short" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

                const filledSeats = v.seats.filter((s) => s.student).length;
                const disabledCount = v.disabledSeats ? v.disabledSeats.length : 0;

                const isCurrentActive =
                  v.matkul === currentMatkul &&
                  v.kelas === currentKelas &&
                  currentSeats &&
                  v.seats.length === currentSeats.length &&
                  v.seats.every((s, idx) => s.student?.id === currentSeats[idx]?.student?.id);

                return (
                  <TableRow key={v.id} className={isCurrentActive ? "bg-muted/20" : undefined}>
                    <TableCell className="font-mono text-xs text-foreground">
                      {timeStr}
                    </TableCell>
                    <TableCell className="font-medium text-xs text-foreground">
                      {v.matkul}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {v.kelas}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span>{filledSeats} kursi</span>
                      {disabledCount > 0 && (
                        <span className="text-muted-foreground/70 ml-1.5 text-[11px]">
                          ({disabledCount} meja mati)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isCurrentActive ? (
                        <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 px-2">
                          <LuCheck className="size-3 text-emerald-500" />
                          <span>Aktif</span>
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(v)}
                          title={`Pulihkan susunan kelas ${v.kelas} (${v.matkul})`}
                          aria-label={`Pulihkan susunan kelas ${v.kelas}`}
                        >
                          Pulihkan
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
