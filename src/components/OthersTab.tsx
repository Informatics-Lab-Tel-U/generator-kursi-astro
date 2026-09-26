import React from "react";
import type { SeatVersion, TabId } from "./types";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface OthersTabProps {
  versions: SeatVersion[];
  restoreVersion: (v: SeatVersion) => void;
  setActiveTab?: (tab: TabId) => void;
}

export default function OthersTab({
  versions,
  restoreVersion,
  setActiveTab,
}: OthersTabProps) {
  const handleRestore = (v: SeatVersion) => {
    restoreVersion(v);
    if (setActiveTab) {
      setActiveTab("seats");
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Riwayat Generate
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Versi susunan tempat duduk yang tersimpan dalam 2 jam terakhir.
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-32 text-xs font-medium text-muted-foreground">Waktu</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Mata Kuliah</TableHead>
              <TableHead className="w-36 text-xs font-medium text-muted-foreground">Kelas</TableHead>
              <TableHead className="w-32 text-xs font-medium text-muted-foreground">Kursi Terisi</TableHead>
              <TableHead className="w-28 text-right text-xs font-medium text-muted-foreground">Aksi</TableHead>
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
                const timeStr = date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                const filledSeats = v.seats.filter((s) => s.student).length;

                return (
                  <TableRow key={v.id}>
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
                      {filledSeats} kursi
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(v)}
                      >
                        Pulihkan
                      </Button>
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
