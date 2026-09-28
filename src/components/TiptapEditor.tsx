import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import './TiptapEditor.css';
import { Toggle } from './ui/toggle';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  LuBold,
  LuItalic,
  LuStrikethrough,
  LuBaseline,
  LuRemoveFormatting,
  LuType,
  LuPlus,
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
    extensions: [StarterKit, TextStyle, Color, FontSize],
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

  const activeColor = (editor.getAttributes('textStyle').color as string) || '';
  const rawFontSize = editor.getAttributes('textStyle').fontSize as string | null | undefined;

  const [fontSizeInput, setFontSizeInput] = useState<string>('15');

  useEffect(() => {
    if (rawFontSize) {
      const num = parseInt(rawFontSize, 10);
      setFontSizeInput(isNaN(num) ? '15' : String(num));
    } else {
      setFontSizeInput('15');
    }
  }, [rawFontSize]);

  const applyFontSize = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseInt(val, 10);
    if (isNaN(num) || num < 6 || num > 120) {
      setFontSizeInput(rawFontSize ? String(parseInt(rawFontSize, 10)) : '15');
      return;
    }
    setFontSizeInput(String(num));
    editor.chain().focus().setFontSize(`${num}px`).run();
  };

  const handleIncreaseFontSize = () => {
    const cur = parseInt(fontSizeInput, 10) || 15;
    applyFontSize(cur + 1);
  };

  const handleDecreaseFontSize = () => {
    const cur = parseInt(fontSizeInput, 10) || 15;
    applyFontSize(Math.max(6, cur - 1));
  };

  const handleResetFontSize = () => {
    editor.chain().focus().unsetFontSize().run();
    setFontSizeInput('15');
  };

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

          <div className="relative inline-flex items-center">
            <label
              className="relative inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Warna Teks"
              aria-label="Warna Teks"
            >
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <LuBaseline className="size-3.5" />
                <span
                  className="w-3.5 h-[2px] mt-0.5 rounded-full"
                  style={{ backgroundColor: activeColor || 'currentColor' }}
                />
              </div>
              <input
                type="color"
                value={activeColor || '#000000'}
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>
            {activeColor ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => editor.chain().focus().unsetColor().run()}
                title="Hapus Warna"
                aria-label="Hapus Warna"
              >
                <LuRemoveFormatting className="size-3.5" />
              </Button>
            ) : null}
          </div>

          <div className="tiptap-fontsize-box flex items-center border border-border rounded-md bg-card/60 px-1 h-7 text-xs">
            <LuType className="size-3.5 text-muted-foreground ml-0.5 mr-0.5 select-none" />
            <button
              type="button"
              className="tiptap-fontsize-btn inline-flex items-center justify-center w-5 h-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={handleDecreaseFontSize}
              title="Kecilkan Font (-1px)"
              aria-label="Kecilkan Font"
            >
              <LuMinus className="size-3" />
            </button>
            <input
              type="number"
              min={6}
              max={120}
              list="tiptap-fontsize-list"
              value={fontSizeInput}
              onChange={(e) => {
                const val = e.target.value;
                setFontSizeInput(val);
                const num = parseInt(val, 10);
                if (!isNaN(num) && num >= 6 && num <= 120) {
                  editor.chain().focus().setFontSize(`${num}px`).run();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyFontSize(fontSizeInput);
                }
              }}
              onBlur={() => applyFontSize(fontSizeInput)}
              className="tiptap-fontsize-input w-8 text-center bg-transparent border-0 focus:outline-none font-semibold text-xs text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="Ukuran Font (px) - bebas ubah angka"
              aria-label="Ukuran Font"
            />
            <datalist id="tiptap-fontsize-list">
              {[10, 12, 14, 15, 16, 18, 20, 24, 28, 32, 36, 48].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <button
              type="button"
              className="tiptap-fontsize-btn inline-flex items-center justify-center w-5 h-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={handleIncreaseFontSize}
              title="Besarkan Font (+1px)"
              aria-label="Besarkan Font"
            >
              <LuPlus className="size-3" />
            </button>
            {rawFontSize ? (
              <button
                type="button"
                className="tiptap-fontsize-btn inline-flex items-center justify-center w-5 h-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-0.5"
                onClick={handleResetFontSize}
                title="Reset Ukuran Font"
                aria-label="Reset Ukuran Font"
              >
                <LuRemoveFormatting className="size-3 text-muted-foreground" />
              </button>
            ) : null}
          </div>

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
