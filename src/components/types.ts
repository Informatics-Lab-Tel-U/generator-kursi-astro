export interface Student {
  id: string;
  name: string;
  kelas: string;
  asprak: string;
}

export interface SeatData {
  seatNo: number;
  student: Student | null;
}

export interface TimerState {
  startTime: string;
  endTime: string;
  isRunning: boolean;
  startedAt: number | null;
}

export interface Racer {
  id: string;
  name: string;
  imageBase64: string | null;
}

export interface RacerJitter {
  currentOffset: number;
  targetOffset: number;
  speed: number;
  finalOffset: number;
}

export interface ProjectorConfig {
  showSeats: boolean;
  showNotes: boolean;
  showCountdown: boolean;
}

export type TabId = 'seats' | 'notes' | 'countdown' | 'leaderboard' | 'others';

export interface TimeBlock {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  color?: string;
}

export interface ScheduleState {
  blocks: TimeBlock[];
  activeBlockId: string | null;
}

export interface SeatVersion {
  id: string;
  timestamp: number;
  seats: SeatData[];
  matkul: string;
  kelas: string;
}
