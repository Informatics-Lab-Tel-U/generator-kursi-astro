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

// Color palette for asprak badges
const ASPRAK_COLORS: Record<string, { bg: string; color: string }> = {};
const COLOR_POOL = [
  { bg: 'rgba(138,180,248,0.04)', color: '#8ab4f8' },
  { bg: 'rgba(129,201,149,0.04)', color: '#81c995' },
  { bg: 'rgba(253,214,99,0.04)', color: '#fdd663' },
  { bg: 'rgba(242,139,130,0.04)', color: '#f28b82' },
  { bg: 'rgba(197,138,249,0.04)', color: '#c58af9' },
  { bg: 'rgba(252,167,112,0.04)', color: '#fca770' },
  { bg: 'rgba(120,215,252,0.04)', color: '#78d7fc' },
  { bg: 'rgba(255,138,186,0.04)', color: '#ff8aba' },
];
let colorIdx = 0;

function getAsprakColor(asprak: string) {
  if (!ASPRAK_COLORS[asprak]) {
    ASPRAK_COLORS[asprak] = COLOR_POOL[colorIdx % COLOR_POOL.length];
    colorIdx++;
  }
  return ASPRAK_COLORS[asprak];
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
  return (
    <div>
      <div className="seat-grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {columns.map((column, colIdx) => (
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
              const asprakColor = seat.student?.asprak
                ? getAsprakColor(seat.student.asprak)
                : null;

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
                      <span
                        className="asprak-badge"
                        style={{
                          background: asprakColor?.bg,
                          color: asprakColor?.color,
                        }}
                      >
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
