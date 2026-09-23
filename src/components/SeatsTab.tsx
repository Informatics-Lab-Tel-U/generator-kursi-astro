import React from 'react';
import type { SeatData } from './types';

interface SeatsTabProps {
  columns: SeatData[][];
  disabledSeats: Set<number>;
  dragSourceSeat: number | null;
  dragOverSeat: number | null;
  isLoading: boolean;
  handleDragStart: (seatNo: number) => void;
  handleDragOver: (e: React.DragEvent, seatNo: number) => void;
  handleDragLeave: () => void;
  handleDrop: (seatNo: number) => void;
  handleDragEnd: () => void;
}

// Color palette for asprak badges (consistent per-asprak)
const COLOR_VARIANTS = [
  'blue',
  'green',
  'amber',
  'purple',
  'rose',
  'cyan',
  'indigo',
  'teal',
] as const;

const ASPRAK_VARIANTS: Record<string, string> = {};

function getAsprakVariant(asprak: string): string {
  if (!ASPRAK_VARIANTS[asprak]) {
    let hash = 0;
    for (let i = 0; i < asprak.length; i++) {
      hash = (hash << 5) - hash + asprak.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % COLOR_VARIANTS.length;
    ASPRAK_VARIANTS[asprak] = COLOR_VARIANTS[idx];
  }
  return ASPRAK_VARIANTS[asprak];
}

function formatName(name: string): { defaultName: string, smallName: string } {
  if (!name) return { defaultName: "", smallName: "" };
  return { defaultName: name, smallName: name };
}

export default function SeatsTab({
  columns,
  disabledSeats,
  dragSourceSeat,
  dragOverSeat,
  isLoading,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
}: SeatsTabProps) {
  const activeColumns = columns.filter((col) => col && col.length > 0);

  return (
    <div>
      <div className="seat-grid" style={{ gridTemplateColumns: `repeat(${activeColumns.length}, 1fr)` }}>
        {activeColumns.map((column, colIdx) => (
          <div key={colIdx} className="seat-column">
            <div className="seat-column-header">
              <span className="col-no">NO</span>
              <span className="col-nim">NAMA</span>
              <span className="col-asprak">ASPRAK</span>
            </div>
            {column.map((seat) => {
              const isDisabled = disabledSeats.has(seat.seatNo);
              const isDragSource = dragSourceSeat === seat.seatNo;
              const isDragOver = dragOverSeat === seat.seatNo;
              const hasStudent = seat.student !== null;
              return (
                <div
                  key={seat.seatNo}
                  className={[
                    "seat-row",
                    isDisabled && "disabled",
                    isDragSource && "dragging",
                    isDragOver && "drag-over",
                    hasStudent ? "occupied" : "empty",
                    isLoading && "skeleton",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  draggable={hasStudent && !isDisabled && !isLoading}
                  onDragStart={() => handleDragStart(seat.seatNo)}
                  onDragOver={(e) =>
                    !isDisabled && handleDragOver(e, seat.seatNo)
                  }
                  onDragLeave={handleDragLeave}
                  onDrop={() => !isDisabled && handleDrop(seat.seatNo)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="cell-no">{seat.seatNo}</span>
                  <span className="cell-nim">
                    {isLoading ? (
                      <span className="skeleton-bar" />
                    ) : isDisabled ? (
                      <span className="disabled-label">—</span>
                    ) : seat.student ? (
                      <>
                        <span className="name-default">{formatName(seat.student.name).defaultName}</span>
                        <span className="name-small">{formatName(seat.student.name).smallName}</span>
                      </>
                    ) : (
                      ""
                    )}
                  </span>
                  <span className="cell-asprak">
                    {isLoading ? (
                      <span className="skeleton-bar short" />
                    ) : isDisabled ? (
                      <span className="disabled-label">—</span>
                    ) : seat.student?.asprak ? (
                      <span className={`asprak-badge asprak-badge-${getAsprakVariant(seat.student.asprak)}`}>
                        {seat.student.asprak}
                      </span>
                    ) : (
                      ""
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
