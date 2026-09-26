import React from 'react';

// Spritesheet specs dari pitmydoro (1440px × 75px, 6 frames)
// Frame native: 240×75 (rasio 3.2:1)
// Animasi: background-position steps() CSS trick

export interface SpriteAnimationProps {
    src: string;
    frameWidth?: number;
    frameHeight?: number;
    totalFrames?: number;
    frameRate?: number;
    paused?: boolean;
    flipX?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// Daftar sprite F1 dari pitmydoro (satu per asprak, round-robin)
export const F1_SPRITES = [
    '/scuderias/sprites/Ferrari-Sheet.png',
    '/scuderias/sprites/Redbull-Sheet.png',
    '/scuderias/sprites/Mclaren-Sheet.png',
    '/scuderias/sprites/Mercedes-Sheet.png',
    '/scuderias/sprites/Alpine-Sheet.png',
    '/scuderias/sprites/AstonMartin-Sheet.png',
    '/scuderias/sprites/Haas-Sheet.png',
    '/scuderias/sprites/Williams-Sheet.png',
    '/scuderias/sprites/RB-Sheet.png',
    '/scuderias/sprites/Sauber-Sheet.png',
];

export const F1_TEAMS = [
    'Scuderia Ferrari',
    'Oracle Red Bull Racing',
    'McLaren Formula 1',
    'Mercedes-AMG Petronas',
    'BWT Alpine F1 Team',
    'Aston Martin Aramco',
    'Haas F1 Team',
    'Williams Racing',
    'Visa Cash App RB',
    'Stake F1 Team Kick Sauber',
];

export function getSpriteForRacer(index: number): string {
    return F1_SPRITES[index % F1_SPRITES.length];
}

export function getTeamNameForRacer(index: number): string {
    return F1_TEAMS[index % F1_TEAMS.length];
}

const injectedKeyframes = new Set<string>();

function ensureKeyframe(frameWidth: number, totalFrames: number) {
    if (typeof document === 'undefined') return;
    const animName = `sprite-slide-${frameWidth}`;
    if (injectedKeyframes.has(animName)) return;

    let styleEl = document.getElementById('sprite-keyframes') as HTMLStyleElement | null;
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'sprite-keyframes';
        document.head.appendChild(styleEl);
    }

    const spriteTotalWidth = frameWidth * totalFrames;
    const rule = `@keyframes ${animName} { from { background-position: 0 0; } to { background-position: -${spriteTotalWidth}px 0; } }`;
    try {
        styleEl.sheet?.insertRule(rule, styleEl.sheet.cssRules.length);
    } catch {
        styleEl.textContent += ` ${rule}`;
    }
    injectedKeyframes.add(animName);
}

export function SpriteAnimation({
    src,
    frameWidth = 240,
    frameHeight = 75,
    totalFrames = 6,
    frameRate = 9,
    paused = false,
    flipX = true,
    className = '',
    style,
}: SpriteAnimationProps) {
    ensureKeyframe(frameWidth, totalFrames);

    const spriteTotalWidth = frameWidth * totalFrames;
    const totalDuration = totalFrames / frameRate;
    const animName = `sprite-slide-${frameWidth}`;

    const finalTransform = flipX
        ? (style?.transform ? `${style.transform} scaleX(-1)` : 'scaleX(-1)')
        : style?.transform;

    return (
        <div
            className={`sprite-car-animation ${className}`}
            style={{
                width: `${frameWidth}px`,
                height: `${frameHeight}px`,
                backgroundImage: `url(${src})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${spriteTotalWidth}px ${frameHeight}px`,
                imageRendering: 'pixelated',
                flexShrink: 0,
                animation: paused
                    ? 'none'
                    : `${animName} ${totalDuration}s steps(${totalFrames}) infinite`,
                ...style,
                transform: finalTransform,
            }}
        />
    );
}

export default SpriteAnimation;
