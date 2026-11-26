import React from 'react';
import TiptapEditor from './TiptapEditor';
import { Button } from './ui/button';
import { LuEye, LuEyeOff } from 'react-icons/lu';

export const DEFAULT_MINI_LABEL = '<p><span style="font-size: 22px"><strong>PW: </strong></span></p>';
export const DEFAULT_NOTES = '<p><span style="font-size: 22px"><strong>Catatan: </strong></span></p>';

/** Returns persisted Mini Label HTML or the default "PW: " template when unset. */
export function getInitialMiniLabel(): string {
  if (typeof window === 'undefined') return DEFAULT_MINI_LABEL;
  try {
    return localStorage.getItem('asprak_mini_label') || DEFAULT_MINI_LABEL;
  } catch {
    return DEFAULT_MINI_LABEL;
  }
}

interface NotesTabProps {
  notes: string;
  setNotes?: (val: string) => void;
  miniLabel?: string;
  setMiniLabel?: (val: string) => void;
  showMiniLabel?: boolean;
  setShowMiniLabel?: (val: boolean) => void;
  readOnly?: boolean;
}

export default function NotesTab({
  notes,
  setNotes,
  miniLabel = '',
  setMiniLabel,
  showMiniLabel = false,
  setShowMiniLabel,
  readOnly = false,
}: NotesTabProps) {
  return (
    <div className={`notes-tab ${readOnly ? 'h-full min-h-0 flex flex-col' : 'flex flex-col gap-3'}`}>
      {!readOnly && setMiniLabel && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Mini Label <span className="font-normal text-muted-foreground">(tampil di kiri atas proyektor)</span>
            </span>
            {setShowMiniLabel && (
              <Button
                type="button"
                variant="outline"
                aria-pressed={!showMiniLabel}
                onClick={() => setShowMiniLabel(!showMiniLabel)}
              >
                {showMiniLabel ? (
                  <>
                    <LuEyeOff className="size-4 mr-1.5" />
                    Sembunyikan
                  </>
                ) : (
                  <>
                    <LuEye className="size-4 mr-1.5" />
                    Tampilkan
                  </>
                )}
              </Button>
            )}
          </div>
          <TiptapEditor content={miniLabel} onUpdate={setMiniLabel} compact />
        </div>
      )}
      <TiptapEditor content={notes} onUpdate={setNotes} readOnly={readOnly} />
    </div>
  );
}
