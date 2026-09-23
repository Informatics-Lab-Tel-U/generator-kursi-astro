import React, { useCallback, useState, useEffect, useRef, memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { LuTrash2, LuClock, LuArrowRight } from "react-icons/lu";

export interface TimeBlockNodeData {
    label: string;
    startTime: string;
    endTime: string;
    color: string;
    isActive: boolean;
    onLabelChange: (id: string, val: string) => void;
    onStartChange: (id: string, val: string) => void;
    onEndChange: (id: string, val: string) => void;
    onDelete: (id: string) => void;
    onActivate: (id: string) => void;
}

function calcDuration(start: string, end: string): string {
    if (!start || !end) return "--";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return "--";
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    if (mins === 0) return "0 mnt";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} mnt`;
    if (m === 0) return `${h} jam`;
    return `${h}j ${m}m`;
}

function TimeBlockNode({ id, data }: NodeProps) {
    const d = data as unknown as TimeBlockNodeData;

    // Refs untuk input agar sepenuhnya uncontrolled selama pengguna mengetik keyboard
    const labelRef = useRef<HTMLInputElement>(null);
    const startRef = useRef<HTMLInputElement>(null);
    const endRef = useRef<HTMLInputElement>(null);

    // Track apakah input sedang difokuskan pengguna
    const isFocusedLabel = useRef(false);
    const isFocusedStart = useRef(false);
    const isFocusedEnd = useRef(false);

    // State durasi dan label preview lokal untuk tampilan badge & header
    const [duration, setDuration] = useState(() => calcDuration(d.startTime, d.endTime));
    const [displayLabel, setDisplayLabel] = useState(d.label);

    // Sinkronisasi data dari luar (misal saat template diterapkan atau jadwal di-reset)
    // HANYA jika input sedang TIDAK aktif difokuskan pengguna
    useEffect(() => {
        if (labelRef.current && !isFocusedLabel.current) {
            labelRef.current.value = d.label;
            setDisplayLabel(d.label);
        }
    }, [d.label]);

    useEffect(() => {
        if (startRef.current && !isFocusedStart.current) {
            startRef.current.value = d.startTime;
        }
        if (endRef.current && !isFocusedEnd.current) {
            endRef.current.value = d.endTime;
        }
        setDuration(calcDuration(d.startTime, d.endTime));
    }, [d.startTime, d.endTime]);

    // Menghentikan event bubbling ke React Flow canvas
    const stopPropagation = useCallback((e: React.SyntheticEvent) => {
        e.stopPropagation();
    }, []);

    // Handlers untuk input label
    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayLabel(e.target.value);
    };

    const handleLabelBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedLabel.current = false;
        const val = e.target.value.trim();
        if (val !== d.label) {
            d.onLabelChange(id, val);
        }
    };

    // Handlers untuk input waktu Mulai
    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const currentEnd = endRef.current?.value || d.endTime;
        setDuration(calcDuration(e.target.value, currentEnd));
    };

    const handleStartBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedStart.current = false;
        const val = e.target.value;
        if (val && val !== d.startTime) {
            d.onStartChange(id, val);
        } else if (!val && startRef.current) {
            startRef.current.value = d.startTime;
            setDuration(calcDuration(d.startTime, endRef.current?.value || d.endTime));
        }
    };

    // Handlers untuk input waktu Selesai
    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const currentStart = startRef.current?.value || d.startTime;
        setDuration(calcDuration(currentStart, e.target.value));
    };

    const handleEndBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedEnd.current = false;
        const val = e.target.value;
        if (val && val !== d.endTime) {
            d.onEndChange(id, val);
        } else if (!val && endRef.current) {
            endRef.current.value = d.endTime;
            setDuration(calcDuration(startRef.current?.value || d.startTime, d.endTime));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (e.key === "Enter") {
            e.currentTarget.blur();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`Sesi ${displayLabel || "tanpa nama"}, sesi aktif: ${d.isActive ? "ya" : "tidak"}`}
            className={`time-block-node ${d.isActive ? "active" : ""}`}
            style={{ "--node-color": d.color } as React.CSSProperties}
            onClick={() => d.onActivate(id)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    d.onActivate(id);
                }
            }}
        >
            <Handle type="target" position={Position.Left} />

            {/* Header dengan nama blok */}
            <div className="time-block-node__header">
                <div
                    className="time-block-node__color-dot"
                    style={{ background: d.color }}
                />
                <input
                    ref={labelRef}
                    defaultValue={d.label}
                    className="time-block-node__label-input nodrag nopan"
                    onChange={handleLabelChange}
                    onFocus={() => { isFocusedLabel.current = true; }}
                    onBlur={handleLabelBlur}
                    onClick={stopPropagation}
                    onMouseDown={stopPropagation}
                    onKeyDown={handleKeyDown}
                    placeholder="Nama sesi"
                    maxLength={20}
                />
                <button
                    className="time-block-node__delete nodrag nopan"
                    onClick={(e) => {
                        e.stopPropagation();
                        d.onDelete(id);
                    }}
                    onMouseDown={stopPropagation}
                    title="Hapus sesi"
                    aria-label={`Hapus sesi ${displayLabel || "ini"}`}
                >
                    <LuTrash2 />
                </button>
            </div>

            {/* Time inputs */}
            <div className="time-block-node__times">
                <div className="time-block-node__time-field">
                    <span className="time-block-node__time-label">Mulai</span>
                    <input
                        ref={startRef}
                        type="time"
                        defaultValue={d.startTime}
                        className="time-block-node__time-input nodrag nopan"
                        onChange={handleStartChange}
                        onFocus={() => { isFocusedStart.current = true; }}
                        onBlur={handleStartBlur}
                        onClick={stopPropagation}
                        onMouseDown={stopPropagation}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <LuArrowRight className="time-block-node__arrow" />
                <div className="time-block-node__time-field">
                    <span className="time-block-node__time-label">Selesai</span>
                    <input
                        ref={endRef}
                        type="time"
                        defaultValue={d.endTime}
                        className="time-block-node__time-input nodrag nopan"
                        onChange={handleEndChange}
                        onFocus={() => { isFocusedEnd.current = true; }}
                        onBlur={handleEndBlur}
                        onClick={stopPropagation}
                        onMouseDown={stopPropagation}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>

            {/* Duration badge */}
            <div className="time-block-node__footer">
                <LuClock style={{ fontSize: "11px", opacity: 0.7 }} />
                <span>{duration}</span>
                {d.isActive && <span className="time-block-node__active-badge">Aktif</span>}
            </div>

            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default memo(TimeBlockNode);
