import React, { useState, useEffect } from 'react';
import type { SeatData, TimerState, Racer, ProjectorConfig, Student, ScheduleState } from './types';
import { PROJECTOR_CHANNEL_NAME } from './scheduleConfig';
import { makeEmptySeats, formatTimeWithMs } from './utils';

import SeatsTab from './SeatsTab';
import NotesTab from './NotesTab';
import CountdownTab from './CountdownTab';
import LeaderboardView from './LeaderboardView';
import { LuLayoutGrid, LuMonitor, LuTimer } from 'react-icons/lu';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { useCountdownTimer, useBlinkEffect } from '../hooks/useCountdown';
import { getStoredRacers } from '../hooks/useRacersGlobal';

import './KursiGenerator.css';

type PanelId = 'seats' | 'notes' | 'countdown';

export function formatMiniTime(remainMs: number): string {
  if (remainMs < 0) remainMs = 0;
  const totalSeconds = Math.floor(remainMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ProjectorView() {
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [disabledSeats, setDisabledSeats] = useState<Set<number>>(new Set());
  const [timer, setTimer] = useState<TimerState>({ startTime: "08:00", endTime: "10:00", isRunning: false, startedAt: null });
  const [now, setNow] = useState(new Date());
  const [racers, setRacers] = useState<Racer[]>(getStoredRacers);
  const [notes, setNotes] = useState<string>('<p><span style="font-size: 22px"><strong>Password: </strong></span></p>');
  const [projectorConfig, setProjectorConfig] = useState<ProjectorConfig>({
    showSeats: true,
    showNotes: true,
    showCountdown: true,
  });
  const [kelas, setKelas] = useState<string>("");
  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);
  const [activeBlockLabel, setActiveBlockLabel] = useState<string>("");
  const [activeBlockColor, setActiveBlockColor] = useState<string>("");
  const [schedule, setSchedule] = useState<ScheduleState | undefined>(undefined);
  type ProjectorTab = 'generator' | 'info' | 'notes';
  const [activeTab, setActiveTab] = useState<ProjectorTab>('generator');
  const [notesWidth, setNotesWidth] = useState(500);

  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 500);
    return () => clearInterval(interval);
  }, [timer.isRunning]);

  const { remainMs, isWarning, isDanger, isFinished } = useCountdownTimer(timer, now);

  const warningForcedOff = useBlinkEffect(isWarning);
  const dangerForcedOff = useBlinkEffect(isDanger);

  const [showGreenFinish, setShowGreenFinish] = useState(false);
  useEffect(() => {
    if (!isFinished) {
      setShowGreenFinish(false);
      return;
    }
    setShowGreenFinish(true);
    const t = setTimeout(() => setShowGreenFinish(false), 2000);
    return () => clearTimeout(t);
  }, [isFinished, schedule?.activeBlockId]);

  const activeBlock = schedule?.blocks.find((b) => b.id === schedule.activeBlockId);
  const activeBlockIdx = schedule
    ? schedule.blocks.findIndex((b) => b.id === schedule.activeBlockId)
    : -1;
  const nextBlock = schedule && activeBlockIdx >= 0 && activeBlockIdx < schedule.blocks.length - 1
    ? schedule.blocks[activeBlockIdx + 1]
    : null;

  const actuallyFinished = showGreenFinish && (!timer.isRunning || remainMs === 0);
  const actuallyDanger = isDanger && !dangerForcedOff && !actuallyFinished;
  const actuallyWarning = isWarning && !warningForcedOff && !actuallyDanger && !actuallyFinished;

  useEffect(() => {
    const allStates = ["time-finished", "time-transition", "time-danger", "time-warning"];
    const remove = (...cls: string[]) => cls.forEach((c) => document.body.classList.remove(c));

    if (actuallyFinished && nextBlock) {
      document.body.classList.add("time-transition");
      remove("time-finished", "time-danger", "time-warning");
    } else if (actuallyFinished) {
      document.body.classList.add("time-finished");
      remove("time-transition", "time-danger", "time-warning");
    } else if (actuallyDanger) {
      document.body.classList.add("time-danger");
      remove("time-finished", "time-transition", "time-warning");
    } else if (actuallyWarning) {
      document.body.classList.add("time-warning");
      remove("time-finished", "time-transition", "time-danger");
    } else {
      remove(...allStates);
    }
    return () => remove(...allStates);
  }, [actuallyFinished, actuallyDanger, actuallyWarning, nextBlock]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = notesWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setNotesWidth(Math.max(250, Math.min(startWidth + deltaX, window.innerWidth - 300)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const channel = new BroadcastChannel(PROJECTOR_CHANNEL_NAME);
    channel.onmessage = (event) => {
      const data = event.data;
      if (data.seats) setSeats(data.seats);
      if (data.disabledSeats) setDisabledSeats(new Set(data.disabledSeats));
      if (data.timer) setTimer(data.timer);
      if (data.racers) setRacers(data.racers);
      if (data.notes) setNotes(data.notes);
      if (data.projectorConfig) setProjectorConfig(data.projectorConfig);
      if (data.kelas !== undefined) setKelas(data.kelas);
      if (data.eligibleStudents) setEligibleStudents(data.eligibleStudents);
      if (data.activeBlockLabel !== undefined) setActiveBlockLabel(data.activeBlockLabel);
      if (data.activeBlockColor !== undefined) setActiveBlockColor(data.activeBlockColor);
      if (data.schedule !== undefined) setSchedule(data.schedule);
    };

    channel.postMessage({ type: 'REQUEST_SYNC' });

    return () => channel.close();
  }, []);

  const totalCols = Math.ceil(seats.length / 10);
  const columns: SeatData[][] = [];
  for (let c = 0; c < totalCols; c++) {
    const col = seats.slice(c * 10, (c + 1) * 10);
    if (col.length > 0) {
      columns.push(col);
    }
  }

  const showSeatsTab = projectorConfig.showSeats;
  const showInfoTab = Boolean(kelas || projectorConfig.showCountdown || projectorConfig.showNotes);
  const showNotesTab = projectorConfig.showNotes;

  const activeTabsCount = [showSeatsTab, showInfoTab, showNotesTab].filter(Boolean).length;
  const hasTabs = activeTabsCount > 1;

  useEffect(() => {
    if (activeTab === 'generator' && !showSeatsTab) {
      setActiveTab(showInfoTab ? 'info' : (showNotesTab ? 'notes' : 'generator'));
    } else if (activeTab === 'info' && !showInfoTab) {
      setActiveTab(showSeatsTab ? 'generator' : (showNotesTab ? 'notes' : 'info'));
    } else if (activeTab === 'notes' && !showNotesTab) {
      setActiveTab(showSeatsTab ? 'generator' : (showInfoTab ? 'info' : 'notes'));
    }
  }, [showSeatsTab, showInfoTab, showNotesTab, activeTab]);

  const renderGenerator = () => (
    <div className="seats-natural" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {columns.length === 0 ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "var(--text-muted)",
            fontSize: "16px",
            flexDirection: "column",
            gap: "12px",
          }}>
            <LuLayoutGrid style={{ fontSize: "48px", opacity: 0.5 }} />
            <span>Menunggu data posisi duduk...</span>
          </div>
        ) : (
          <SeatsTab
            columns={columns}
            disabledSeats={disabledSeats}
            dragSourceSeat={null}
            dragOverSeat={null}
            isLoading={false}
            handleDragStart={() => { }}
            handleDragOver={() => { }}
            handleDragLeave={() => { }}
            handleDrop={() => { }}
            handleDragEnd={() => { }}
          />
        )}
      </div>
    </div>
  );

  const hasRightColumn = Boolean(projectorConfig.showNotes || projectorConfig.showCountdown);

  const renderInfo = () => (
    <div style={{ display: 'flex', gap: '4px', flex: 1, overflow: 'hidden' }}>
      {kelas && (
        <div
          className="leaderboard-natural"
          style={{
            width: hasRightColumn ? `${notesWidth}px` : '100%',
            flex: hasRightColumn ? '0 0 auto' : '1',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '100%',
            minHeight: 0,
            overflow: 'hidden',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            boxSizing: 'border-box',
            marginRight: '2px'
          }}
        >
          <LeaderboardView room={kelas} students={eligibleStudents} showBorder={false} />
        </div>
      )}

      {kelas && hasRightColumn && (
        <div
          onMouseDown={startDrag}
          style={{
            width: '6px',
            cursor: 'col-resize',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            margin: '0 0 0 1px',
            zIndex: 10,
            padding: '0'
          }}
        >
          <div style={{ width: '1px', height: '28px', background: 'var(--border)', borderRadius: '999px' }}></div>
        </div>
      )}

      {hasRightColumn && (
        <div style={{
          flex: '1 1 0',
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          gap: '16px',
        }}>
          {projectorConfig.showNotes && (
            <div
              className="notes-natural"
              style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: projectorConfig.showCountdown ? '0 0 auto' : '1 1 0',
                minHeight: '180px'
              }}
            >
              <NotesTab notes={notes} readOnly={true} />
            </div>
          )}

          {projectorConfig.showCountdown && (
            <CountdownTab
              timer={timer}
              racers={racers}
              readOnly={true}
              kelas={kelas}
              eligibleStudents={eligibleStudents}
              activeBlockLabel={activeBlockLabel}
              activeBlockColor={activeBlockColor}
              schedule={schedule}
            />
          )}
        </div>
      )}
    </div>
  );

  const renderNotes = () => (
    <div className="notes-natural" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <NotesTab notes={notes} readOnly={true} />
    </div>
  );

  if (!showSeatsTab && !showInfoTab && !showNotesTab) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}><LuMonitor /></div>
          <h2 style={{ margin: 0, fontWeight: 600 }}>Mode Proyektor Menunggu...</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Aktifkan tampilan dari panel kontrol</p>
        </div>
      </div>
    );
  }

  const currentBlockLabel = activeBlockLabel || activeBlock?.label;
  const showMiniTimer = timer.isRunning && (!projectorConfig.showCountdown || activeTab !== 'info');
  const hasTopBar = hasTabs || showMiniTimer;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '16px 16px', boxSizing: 'border-box', background: 'var(--bg-page)', position: 'relative' }}>
      {hasTopBar && (
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40px',
          marginBottom: '12px',
          flexShrink: 0
        }}>
          {hasTabs && (
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as ProjectorTab)}>
              <TabsList className="bg-card/90 border border-border/70 shadow-xs backdrop-blur-md">
                {showSeatsTab && <TabsTrigger value="generator">Posisi Duduk</TabsTrigger>}
                {showInfoTab && <TabsTrigger value="info">Umum</TabsTrigger>}
                {showNotesTab && <TabsTrigger value="notes">Catatan</TabsTrigger>}
              </TabsList>
            </Tabs>
          )}

          {showMiniTimer && (
            <div
              onClick={() => {
                if (showInfoTab && projectorConfig.showCountdown) {
                  setActiveTab('info');
                }
              }}
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                textAlign: 'right',
                userSelect: 'none',
              }}
              className={showInfoTab && projectorConfig.showCountdown ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
              title={showInfoTab && projectorConfig.showCountdown ? "Klik untuk melihat waktu penuh di tab Umum" : undefined}
            >
              <div className="mini-timer-label text-[10px] font-semibold text-muted-foreground tracking-widest leading-none mb-1">
                {currentBlockLabel || "Waktu Tersisa"}
              </div>
              <div
                className={`mini-timer-time leading-none ${actuallyFinished
                  ? "finished"
                  : isDanger
                    ? "danger"
                    : isWarning
                      ? "warning"
                      : ""
                  }`}
                style={{ fontSize: "28px", fontWeight: 700 }}
              >
                {isFinished ? (
                  <span>00:00</span>
                ) : (() => {
                  const { main, centi } = formatTimeWithMs(remainMs);
                  return (
                    <>
                      <span>{main}</span>
                      <span style={{ fontSize: "0.65em", opacity: 0.5 }}>.{centi}</span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {showSeatsTab && (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: activeTab === 'generator' ? 'flex' : 'none',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {renderGenerator()}
          </div>
        )}
        {showInfoTab && (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: activeTab === 'info' ? 'flex' : 'none',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {renderInfo()}
          </div>
        )}
        {showNotesTab && (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: activeTab === 'notes' ? 'flex' : 'none',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {renderNotes()}
          </div>
        )}
      </div>
    </div>
  );
}
