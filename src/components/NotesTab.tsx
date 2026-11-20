import React from 'react';
import TiptapEditor from './TiptapEditor';
import { Button } from './ui/button';
import { LuX } from 'react-icons/lu';

interface NotesTabProps {
  notes: string;
  setNotes?: (val: string) => void;
  miniLabel?: string;
  setMiniLabel?: (val: string) => void;
  readOnly?: boolean;
}

export default function NotesTab({ notes, setNotes, miniLabel = '', setMiniLabel, readOnly = false }: NotesTabProps) {
  const hasMiniLabelText = miniLabel.replace(/<[^>]*>/g, '').trim() !== '';

  return (
    <div className={`notes-tab ${readOnly ? 'h-full min-h-0 flex flex-col' : 'flex flex-col gap-3'}`}>
      {!readOnly && setMiniLabel && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Mini Label <span className="font-normal text-muted-foreground">(tampil di kiri atas proyektor)</span>
            </span>
            {hasMiniLabelText && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setMiniLabel('')}
                className="h-6 px-2 text-xs text-muted-foreground"
              >
                <LuX className="size-3 mr-1" />
                Kosongkan
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
