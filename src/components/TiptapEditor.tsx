import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './TiptapEditor.css';
import { Toggle } from './ui/toggle';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  LuBold,
  LuItalic,
  LuStrikethrough,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuList,
  LuListOrdered,
  LuQuote,
  LuCode,
  LuMinus,
  LuUndo,
  LuRedo,
} from 'react-icons/lu';

interface Props {
  content: string;
  onUpdate?: (html: string) => void;
  readOnly?: boolean;
}

export default function TiptapEditor({ content, onUpdate, readOnly = false }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onUpdate) onUpdate(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className={`tiptap-wrapper rounded-lg border border-border bg-card overflow-hidden ${readOnly ? 'readonly' : ''}`}>
      {!readOnly && (
        <div className="tiptap-toolbar flex items-center flex-wrap gap-1 p-1.5 border-b border-border bg-muted/30">
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            title="Tebal (Ctrl+B)"
            aria-label="Tebal"
          >
            <LuBold className="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            title="Miring (Ctrl+I)"
            aria-label="Miring"
          >
            <LuItalic className="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            title="Coret"
            aria-label="Coret"
          >
            <LuStrikethrough className="size-3.5" />
          </Toggle>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
            aria-label="Heading 1"
          >
            <LuHeading1 className="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
            aria-label="Heading 2"
          >
            <LuHeading2 className="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
            aria-label="Heading 3"
          >
            <LuHeading3 className="size-3.5" />
          </Toggle>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            title="Daftar Poin"
            aria-label="Daftar Poin"
          >
            <LuList className="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            title="Daftar Angka"
            aria-label="Daftar Angka"
          >
            <LuListOrdered className="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
            title="Kutipan"
            aria-label="Kutipan"
          >
            <LuQuote className="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('codeBlock')}
            onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Blok Kode"
            aria-label="Blok Kode"
          >
            <LuCode className="size-3.5" />
          </Toggle>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Garis Pemisah"
            aria-label="Garis Pemisah"
          >
            <LuMinus className="size-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <LuUndo className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <LuRedo className="size-3.5" />
          </Button>
        </div>
      )}
      <EditorContent editor={editor} className="p-3 min-h-[200px]" />
    </div>
  );
}
