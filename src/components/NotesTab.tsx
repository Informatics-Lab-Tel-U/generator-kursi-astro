import React from 'react';
import TiptapEditor from './TiptapEditor';

interface NotesTabProps {
  notes: string;
  setNotes?: (val: string) => void;
  readOnly?: boolean;
}

export default function NotesTab({ notes, setNotes, readOnly = false }: NotesTabProps) {
  return (
    <div className="notes-tab mt-5">
      <TiptapEditor content={notes} onUpdate={setNotes} readOnly={readOnly} />
    </div>
  );
}
