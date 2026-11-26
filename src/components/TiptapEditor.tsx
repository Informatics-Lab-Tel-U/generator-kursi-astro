import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
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
  LuImagePlus,
  LuTable,
  LuTrash2,
  LuUndo,
  LuRedo,
  LuX,
} from 'react-icons/lu';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_WIDTH_PRESETS = [25, 50, 75, 100] as const;

const ResizableImage = Image.extend({
  addNodeView() {
    const parentFactory = this.parent?.();
    if (!parentFactory) return null;
    return (props) => {
      const nodeView = parentFactory(props);
      if (!nodeView || !(nodeView.dom instanceof HTMLElement)) {
        return nodeView;
      }
      const img = nodeView.dom.querySelector('img');
      const origUpdate = nodeView.update?.bind(nodeView);
      nodeView.update = (updatedNode, decorations, innerDecorations) => {
        if (updatedNode.type.name !== this.name) return false;
        const kept = origUpdate ? origUpdate(updatedNode, decorations, innerDecorations) : true;
        if (kept && img) {
          const w = updatedNode.attrs.width;
          const h = updatedNode.attrs.height;
          img.style.width = w ? `${w}px` : '';
          img.style.height = h ? `${h}px` : '';
        }
        return kept;
      };
      return nodeView;
    };
  },
});

function extractImageFiles(transfer: DataTransfer | null | undefined): File[] {
  if (!transfer) return [];
  const directFiles = Array.from(transfer.files ?? []).filter((f) =>
    f.type.startsWith('image/'),
  );
  if (directFiles.length > 0) return directFiles;
  return Array.from(transfer.items ?? [])
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((f): f is File => f !== null);
}

interface Props {
  content: string;
  onUpdate?: (html: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export default function TiptapEditor({ content, onUpdate, readOnly = false, compact = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageWidthInput, setImageWidthInput] = useState<string>('');

  const insertImageFile = (file: File) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      setImageError('Format gambar harus PNG, JPG, WEBP, atau GIF.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Ukuran gambar maksimal 4 MB.');
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string' || !result.startsWith('data:image/')) {
        setImageError('Gagal membaca berkas gambar.');
        return;
      }
      editorRef.current
        ?.chain()
        .focus()
        .setImage({ src: result, alt: file.name || 'Gambar catatan' })
        .run();
    };
    reader.onerror = () => setImageError('Gagal membaca berkas gambar.');
    reader.readAsDataURL(file);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontSize,
      ResizableImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'tiptap-image',
        },
        resize: readOnly
          ? false
          : {
              enabled: true,
              directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'],
              minWidth: 50,
              minHeight: 50,
              alwaysPreserveAspectRatio: true,
            },
      }),
      Table.configure({
        resizable: !readOnly,
        renderWrapper: true,
        cellMinWidth: 60,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable: !readOnly,
    shouldRerenderOnTransaction: !readOnly,
    editorProps: {
      handlePaste: (_view, event) => {
        if (readOnly) return false;
        const imageFiles = extractImageFiles(event.clipboardData);
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach(insertImageFile);
        return true;
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (readOnly || moved) return false;
        const imageFiles = extractImageFiles(event.dataTransfer);
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach(insertImageFile);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) onUpdate(editor.getHTML());
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const activeColor = (editor.getAttributes('textStyle').color as string) || '';
  const rawFontSize = editor.getAttributes('textStyle').fontSize as string | null | undefined;
  const isImageSelected = editor.isActive('image');
  const isTableActive = editor.isActive('table');
  const rawImageWidth = isImageSelected ? (editor.getAttributes('image').width as number | string | null | undefined) : null;

  const [fontSizeInput, setFontSizeInput] = useState<string>('15');

  useEffect(() => {
    if (rawFontSize) {
      const num = parseInt(rawFontSize, 10);
      setFontSizeInput(isNaN(num) ? '15' : String(num));
    } else {
      setFontSizeInput('15');
    }
  }, [rawFontSize]);

  useEffect(() => {
    if (!isImageSelected) {
      setImageWidthInput('');
      return;
    }
    if (rawImageWidth !== null && rawImageWidth !== undefined && rawImageWidth !== '') {
      const num = Math.round(Number(rawImageWidth));
      setImageWidthInput(Number.isFinite(num) && num > 0 ? String(num) : '');
    } else {
      setImageWidthInput('');
    }
  }, [isImageSelected, rawImageWidth]);

  const applyImageWidth = (px: number | null) => {
    if (px === null) {
      editor.chain().focus().updateAttributes('image', { width: null, height: null }).run();
      setImageWidthInput('');
      return;
    }
    const clamped = Math.max(50, Math.min(2000, Math.round(px)));
    setImageWidthInput(String(clamped));
    editor.chain().focus().updateAttributes('image', { width: clamped, height: null }).run();
  };

  const applyImagePercent = (percent: number) => {
    const editorEl = editor.view.dom as HTMLElement;
    const style = getComputedStyle(editorEl);
    const padX = parseFloat(style.paddingLeft || '0') + parseFloat(style.paddingRight || '0');
    const available = Math.max(200, Math.floor(editorEl.clientWidth - padX));
    applyImageWidth(Math.round((available * percent) / 100));
  };

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

  const wrapperClass = compact && readOnly
    ? 'tiptap-wrapper tiptap-compact tiptap-minimal-readonly readonly'
    : `tiptap-wrapper rounded-lg border border-border h-full bg-card ${compact ? 'tiptap-compact' : ''} ${readOnly ? 'readonly overflow-y-auto min-h-0 flex flex-col' : ''}`;

  return (
    <div className={wrapperClass}>
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7"
            onClick={() => fileInputRef.current?.click()}
            title="Sisipkan Gambar (atau paste / drag-drop)"
            aria-label="Sisipkan Gambar"
          >
            <LuImagePlus className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            title="Sisipkan Tabel (3×3)"
            aria-label="Sisipkan Tabel"
          >
            <LuTable className="size-3.5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) insertImageFile(file);
              e.target.value = '';
            }}
          />

          {isTableActive && (
            <div className="tiptap-table-box flex items-center gap-0.5 border border-border rounded-md bg-card/60 px-1 h-7 text-xs shrink-0">
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="tiptap-imgsize-btn hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Tambah Kolom Sesudah"
              >
                + Kolom
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                disabled={!editor.can().deleteColumn()}
                className="tiptap-imgsize-btn hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
                title="Hapus Kolom Aktif"
              >
                - Kolom
              </button>
              <span className="h-3.5 w-px bg-border mx-0.5" aria-hidden="true" />
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="tiptap-imgsize-btn hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Tambah Baris Sesudah"
              >
                + Baris
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteRow().run()}
                disabled={!editor.can().deleteRow()}
                className="tiptap-imgsize-btn hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
                title="Hapus Baris Aktif"
              >
                - Baris
              </button>
              <span className="h-3.5 w-px bg-border mx-0.5" aria-hidden="true" />
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="tiptap-imgsize-icon-btn hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                title="Hapus Tabel"
                aria-label="Hapus Tabel"
              >
                <LuTrash2 className="size-3" />
              </button>
            </div>
          )}

          {isImageSelected && (
            <div className="tiptap-imgsize-box flex items-center gap-0.5 border border-border rounded-md bg-card/60 px-1 h-7 text-xs shrink-0">
              {IMAGE_WIDTH_PRESETS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyImagePercent(pct)}
                  className="tiptap-imgsize-btn hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={`Set lebar gambar ${pct}% lebar editor`}
                >
                  {pct}%
                </button>
              ))}
              <span className="h-3.5 w-px bg-border mx-0.5" aria-hidden="true" />
              <div className="flex items-center">
                <input
                  type="number"
                  min={50}
                  max={2000}
                  placeholder="auto"
                  value={imageWidthInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setImageWidthInput(val);
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 50 && num <= 2000) {
                      editor.chain().updateAttributes('image', { width: num, height: null }).run();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const num = parseInt(imageWidthInput, 10);
                      if (!isNaN(num)) applyImageWidth(num);
                    }
                  }}
                  onBlur={() => {
                    if (!imageWidthInput.trim()) return;
                    const num = parseInt(imageWidthInput, 10);
                    if (!isNaN(num)) applyImageWidth(num);
                  }}
                  className="tiptap-fontsize-input w-10 text-right bg-transparent border-0 focus:outline-none font-semibold text-xs text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  title="Lebar gambar dalam pixel (50-2000 px)"
                  aria-label="Lebar gambar (px)"
                />
                <span className="text-[11px] text-muted-foreground select-none pl-0.5 pr-1">
                  px
                </span>
              </div>
              {rawImageWidth ? (
                <button
                  type="button"
                  onClick={() => applyImageWidth(null)}
                  className="tiptap-imgsize-icon-btn hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Reset ukuran asli gambar"
                  aria-label="Reset ukuran gambar"
                >
                  <LuRemoveFormatting className="size-3 text-muted-foreground" />
                </button>
              ) : null}
            </div>
          )}

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
      {!readOnly && imageError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs border-b border-destructive/30 bg-destructive/10 text-destructive"
        >
          <span>{imageError}</span>
          <button
            type="button"
            aria-label="Tutup pesan gambar"
            onClick={() => setImageError(null)}
            className="p-0.5 rounded hover:bg-destructive/15 cursor-pointer"
          >
            <LuX className="size-3.5" />
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
}
