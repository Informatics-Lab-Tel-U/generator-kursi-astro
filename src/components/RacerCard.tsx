import React from 'react';
import type { Racer } from './types';
import { LuTrash2 } from 'react-icons/lu';
import { Button } from './ui/button';
import { SpriteAnimation, getSpriteForRacer, getTeamNameForRacer } from './SpriteAnimation';

export interface RacerCardProps {
    racer: Racer;
    index: number;
    onRemove?: (id: string) => void;
    onImageUpload?: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
    readOnly?: boolean;
    className?: string;
}

export function RacerCard({
    racer,
    index,
    onRemove,
    readOnly = false,
    className = '',
}: RacerCardProps) {
    const spriteUrl = getSpriteForRacer(index);
    const teamName = getTeamNameForRacer(index);

    return (
        <div
            className={`racer-card flex items-center justify-between p-2 px-2.5 rounded-lg border border-border bg-card shadow-xs hover:border-border/80 transition-all ${className}`}
        >
            <div className="flex flex-col min-w-0 mr-1">
                <span className="font-mono font-bold text-xs text-foreground tracking-wide truncate">
                    {racer.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[100px]">
                    {teamName}
                </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
                <div className="flex items-center">
                    <SpriteAnimation
                        src={spriteUrl}
                        frameWidth={90}
                        frameHeight={28}
                        totalFrames={6}
                        frameRate={9}
                        paused={false}
                        flipX={true}
                    />
                </div>

                {!readOnly && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-6 w-6"
                        onClick={() => onRemove?.(racer.id)}
                        title={`Hapus pembalap ${racer.name}`}
                        aria-label={`Hapus pembalap ${racer.name}`}
                    >
                        <LuTrash2 className="size-3.5" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export default RacerCard;
