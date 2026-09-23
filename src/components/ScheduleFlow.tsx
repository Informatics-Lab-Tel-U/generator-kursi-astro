import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    Panel,
    useNodesState,
    useEdgesState,
    addEdge,
    reconnectEdge,
    MarkerType,
    type Connection,
    type Edge,
    type Node,
    type ReactFlowInstance,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./ScheduleFlow.css";

import type { TimeBlock, ScheduleState, TimerState } from "./types";
import TimeBlockNode from "./TimeBlockNode";
import { getDefaultScheduleTemplates } from "./utils";
import { BLOCK_COLOR_SEQUENCE } from "./scheduleConfig";
import { LuPlus, LuLayoutTemplate, LuChevronUp, LuPlay, LuPause } from "react-icons/lu";


// Templates sesi praktikum — waktu disesuaikan dengan sesi aktif hari ini
interface Template {
    id: string;
    label: string;
    blocks: Omit<TimeBlock, "id">[];
}

// Helper: generate unique id
function uid() {
    return `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Konversi data blocks ke node React Flow
function blocksToNodes(
    blocks: TimeBlock[],
    activeId: string | null,
    handlers: {
        onLabelChange: (id: string, v: string) => void;
        onStartChange: (id: string, v: string) => void;
        onEndChange: (id: string, v: string) => void;
        onDelete: (id: string) => void;
        onActivate: (id: string) => void;
    }
): Node[] {
    return blocks.map((b, i) => ({
        id: b.id,
        type: "timeBlock",
        position: { x: i * 280, y: 40 },
        draggable: true,
        data: {
            label: b.label,
            startTime: b.startTime,
            endTime: b.endTime,
            color: b.color ?? BLOCK_COLOR_SEQUENCE[i % BLOCK_COLOR_SEQUENCE.length],
            isActive: b.id === activeId,
            ...handlers,
        },
    }));
}

// Konversi urutan blocks ke edge koneksi dengan penanda panah
function blocksToEdges(blocks: TimeBlock[]): Edge[] {
    return blocks.slice(0, -1).map((b, i) => ({
        id: `e-${b.id}-${blocks[i + 1].id}`,
        source: b.id,
        target: blocks[i + 1].id,
        type: "smoothstep",
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: "#888",
        },
        style: { stroke: "#888", strokeWidth: 2 },
    }));
}

// nodeTypes di luar komponen untuk referensi objek stabil
const nodeTypes = { timeBlock: TimeBlockNode };

interface ScheduleFlowProps {
    schedule: ScheduleState;
    setSchedule: React.Dispatch<React.SetStateAction<ScheduleState>>;
    setTimer: React.Dispatch<React.SetStateAction<TimerState>>;
    timer?: TimerState;
    onStart?: () => void;
    onStop?: () => void;
}

export default function ScheduleFlow({
    schedule,
    setSchedule,
    setTimer,
    timer,
    onStart,
    onStop,
}: ScheduleFlowProps) {
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const templateMenuRef = useRef<HTMLDivElement>(null);

    // Menutup menu template jika klik di luar
    useEffect(() => {
        if (!showTemplateMenu) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as globalThis.Node)) {
                setShowTemplateMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showTemplateMenu]);

    // Handlers untuk interaksi node
    const onLabelChange = useCallback((id: string, val: string) => {
        setSchedule((s) => ({
            ...s,
            blocks: s.blocks.map((b) => (b.id === id ? { ...b, label: val } : b)),
        }));
    }, [setSchedule]);

    const onStartChange = useCallback((id: string, val: string) => {
        setSchedule((s) => {
            const newBlocks = s.blocks.map((b) => (b.id === id ? { ...b, startTime: val } : b));
            if (s.activeBlockId === id) setTimer((t) => ({ ...t, startTime: val }));
            return { ...s, blocks: newBlocks };
        });
    }, [setSchedule, setTimer]);

    const onEndChange = useCallback((id: string, val: string) => {
        setSchedule((s) => {
            const newBlocks = s.blocks.map((b) => (b.id === id ? { ...b, endTime: val } : b));
            if (s.activeBlockId === id) setTimer((t) => ({ ...t, endTime: val }));
            return { ...s, blocks: newBlocks };
        });
    }, [setSchedule, setTimer]);

    const onDelete = useCallback((id: string) => {
        setSchedule((s) => {
            const remaining = s.blocks.filter((b) => b.id !== id);
            let nextActiveId = s.activeBlockId;
            if (s.activeBlockId === id) {
                const fallback = remaining[0];
                nextActiveId = fallback ? fallback.id : null;
                if (fallback) {
                    setTimer((t) => ({ ...t, startTime: fallback.startTime, endTime: fallback.endTime }));
                }
            }
            return {
                blocks: remaining,
                activeBlockId: nextActiveId,
            };
        });
    }, [setSchedule, setTimer]);

    const onActivate = useCallback((id: string) => {
        setSchedule((s) => {
            const block = s.blocks.find((b) => b.id === id);
            if (!block) return s;
            setTimer((t) => ({ ...t, startTime: block.startTime, endTime: block.endTime }));
            return { ...s, activeBlockId: id };
        });
    }, [setSchedule, setTimer]);

    const handlers = useMemo(
        () => ({ onLabelChange, onStartChange, onEndChange, onDelete, onActivate }),
        [onLabelChange, onStartChange, onEndChange, onDelete, onActivate]
    );

    // State nodes dan edges diinisialisasi dari blocks saat ini
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
        blocksToNodes(schedule.blocks, schedule.activeBlockId, handlers)
    );
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
        blocksToEdges(schedule.blocks)
    );

    // Track jumlah dan ID blok saat ini untuk deteksi tambah/hapus blok atau ganti template
    const prevBlockCountRef = React.useRef(schedule.blocks.length);
    const prevBlockIdsRef = React.useRef(schedule.blocks.map((b) => b.id).join(","));

    // Sinkronisasi data node saat jadwal berubah
    React.useEffect(() => {
        const currentIds = schedule.blocks.map((b) => b.id).join(",");
        const countOrStructureChanged =
            schedule.blocks.length !== prevBlockCountRef.current ||
            currentIds !== prevBlockIdsRef.current;

        prevBlockCountRef.current = schedule.blocks.length;
        prevBlockIdsRef.current = currentIds;

        setNodes((nds) => {
            const existingMap = new Map(nds.map((n) => [n.id, n]));
            return schedule.blocks.map((b, i) => {
                const existing = existingMap.get(b.id);
                // Pertahankan posisi drag pengguna jika node sudah ada
                const position = existing ? existing.position : { x: i * 280, y: 40 };
                return {
                    id: b.id,
                    type: "timeBlock",
                    position,
                    draggable: true,
                    data: {
                        label: b.label,
                        startTime: b.startTime,
                        endTime: b.endTime,
                        color: b.color ?? BLOCK_COLOR_SEQUENCE[i % BLOCK_COLOR_SEQUENCE.length],
                        isActive: b.id === schedule.activeBlockId,
                        ...handlers,
                    },
                };
            });
        });

        // Sinkronisasi edges setiap kali struktur atau ID blok berubah (misal template baru atau tambah/hapus blok)
        if (countOrStructureChanged) {
            setEdges(blocksToEdges(schedule.blocks));
        }

        // Hanya jalankan fitView jika jumlah blok bertambah/berkurang atau ganti template,
        // TIDAK dijalankan saat sekadar mengetik jam atau label agar input tidak kehilangan fokus.
        if (countOrStructureChanged && rfInstance && schedule.blocks.length > 0) {
            setTimeout(() => rfInstance.fitView({ padding: 0.3, duration: 200 }), 50);
        }
    }, [schedule.blocks, schedule.activeBlockId, handlers, setNodes, setEdges, rfInstance]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: "#888" }, style: { stroke: "#888", strokeWidth: 2 } }, eds)),
        [setEdges]
    );

    // Reconnect sambungan garis ke handle lain
    const onReconnect = useCallback(
        (oldEdge: Edge, newConnection: Connection) =>
            setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds)),
        [setEdges]
    );

    // Tambah blok sesi baru
    const addBlock = useCallback(() => {
        const lastBlock = schedule.blocks[schedule.blocks.length - 1];
        const colorIdx = schedule.blocks.length % BLOCK_COLOR_SEQUENCE.length;
        const newBlock: TimeBlock = {
            id: uid(),
            label: "Sesi Baru",
            startTime: lastBlock?.endTime ?? "08:00",
            endTime: lastBlock?.endTime ?? "09:00",
            color: BLOCK_COLOR_SEQUENCE[colorIdx],
        };
        setSchedule((s) => {
            const newBlocks = [...s.blocks, newBlock];
            const nextActiveId = s.activeBlockId ?? newBlock.id;
            if (!s.activeBlockId) {
                setTimer((t) => ({ ...t, startTime: newBlock.startTime, endTime: newBlock.endTime }));
            }
            return { ...s, blocks: newBlocks, activeBlockId: nextActiveId };
        });
    }, [schedule.blocks, setSchedule, setTimer]);

    // Terapkan template sesi
    const applyTemplate = useCallback((tpl: Template) => {
        const blocks: TimeBlock[] = tpl.blocks.map((b) => ({ ...b, id: uid() }));
        const firstBlock = blocks[0];
        setSchedule({
            blocks,
            activeBlockId: firstBlock ? firstBlock.id : null,
        });
        if (firstBlock) {
            setTimer((t) => ({ ...t, startTime: firstBlock.startTime, endTime: firstBlock.endTime }));
        }
    }, [setSchedule, setTimer]);

    const hasBlocks = schedule.blocks.length > 0;

    const activeBlock = schedule.blocks.find((b) => b.id === schedule.activeBlockId);

    return (
        <div className="schedule-flow-wrapper">
            {/* Canvas React Flow dengan kontrol dan overlay empty state */}
            <div className="schedule-flow-canvas">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onReconnect={onReconnect}
                    onInit={setRfInstance}
                    nodeTypes={nodeTypes}
                    fitView={hasBlocks}
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.3}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable
                    edgesReconnectable
                    edgesFocusable
                    deleteKeyCode="Backspace"
                >
                    <Background
                        variant={BackgroundVariant.Lines}
                        gap={24}
                        size={1}
                        color="var(--border-light)"
                    />
                    <Controls
                        showInteractive={false}
                        style={{ bottom: 8, right: 8, top: "auto", left: "auto" }}
                    />

                    {/* Tombol Tambah Blok di pojok kiri atas canvas */}
                    <Panel position="top-left">
                        <button className="schedule-flow-add-btn" onClick={addBlock}>
                            <LuPlus /> Tambah Blok
                        </button>
                    </Panel>

                    {/* Tombol Mulai di pojok kanan atas canvas */}
                    <Panel position="top-right">
                        {timer && (!timer.isRunning ? (
                            <button
                                type="button"
                                className="schedule-flow-play-btn"
                                disabled={!activeBlock}
                                onClick={onStart}
                                title={activeBlock ? "Mulai sesi ini" : "Pilih sesi terlebih dahulu"}
                            >
                                <LuPlay /> Mulai
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="schedule-flow-pause-btn"
                                onClick={onStop}
                                title="Hentikan sesi"
                            >
                                <LuPause /> Hentikan
                            </button>
                        ))}
                    </Panel>

                    {/* Tombol Pilihan Template di pojok kiri bawah canvas */}
                    <Panel position="bottom-left">
                        <div className="schedule-template-dropdown-wrapper" ref={templateMenuRef}>
                            {showTemplateMenu && (
                                <div className="schedule-template-menu">
                                    <div className="schedule-template-menu-header">Pilih Template</div>
                                    {getDefaultScheduleTemplates().map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className="schedule-template-menu-item"
                                            onClick={() => {
                                                applyTemplate(t);
                                                setShowTemplateMenu(false);
                                            }}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <button
                                type="button"
                                className="schedule-flow-add-btn"
                                onClick={() => setShowTemplateMenu((v) => !v)}
                                aria-expanded={showTemplateMenu}
                                aria-haspopup="true"
                            >
                                <LuLayoutTemplate /> Template
                                <LuChevronUp
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.7,
                                        transform: showTemplateMenu ? "rotate(180deg)" : "none",
                                        transition: "transform 0.15s ease",
                                    }}
                                />
                            </button>
                        </div>
                    </Panel>

                    {/* Tampilan saat kanvas kosong */}
                    {!hasBlocks && (
                        <Panel
                            position="top-center"
                            className="schedule-flow-empty-panel"
                            style={{
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                margin: 0,
                            }}
                        >
                            <div className="schedule-flow-empty">
                                <LuLayoutTemplate style={{ fontSize: "32px", opacity: 0.3 }} />
                                <span>Pilih template atau tambah blok secara manual</span>
                                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                    <button className="schedule-flow-add-btn" onClick={addBlock}>
                                        <LuPlus /> Tambah Blok
                                    </button>
                                    <button
                                        className="schedule-flow-add-btn"
                                        onClick={() => setShowTemplateMenu((v) => !v)}
                                    >
                                        <LuLayoutTemplate /> Pilih Template
                                    </button>
                                </div>
                            </div>
                        </Panel>
                    )}
                </ReactFlow>
            </div>
        </div>
    );
}
