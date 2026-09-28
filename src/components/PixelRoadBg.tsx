import React, { useRef, useEffect } from 'react';

export interface PixelRoadBgProps {
    className?: string;
    style?: React.CSSProperties;
    speedPxPerSec?: number;
    fixedDuration?: number;
    /** 'loop' for infinite road preview (default, used in RacerCard), 'race' for full Start -> Road -> Finish track */
    mode?: 'loop' | 'race';
    /** Race progress from 0.0 (start line) to 1.0 (finish line) */
    progress?: number;
    /** Total countdown seconds to calculate the number of road tiles */
    totalSecs?: number;
    /** Whether timer is currently active */
    isRunning?: boolean;
    /** Whether race has concluded */
    isFinished?: boolean;
    /** Fallback imageSrc if caller explicitly overrides */
    imageSrc?: string;
    /** Pause animation */
    paused?: boolean;
    /** Whether to draw the start line tile at k=0 (default true) */
    showStartLine?: boolean;
    /** Whether to draw the finish line tile at k=nRoadTiles+1 (default true) */
    showFinishLine?: boolean;
}

// Module-level image cache so images decode once and stay in memory
const ROAD_SRC = '/image/roads/pixel-road.png';
const START_SRC = '/image/roads/pixel-road-start.png';
const FINISH_SRC = '/image/roads/pixel-road-finish.png';

let cachedRoadImg: HTMLImageElement | null = null;
let cachedStartImg: HTMLImageElement | null = null;
let cachedFinishImg: HTMLImageElement | null = null;

function getCachedImages() {
    if (typeof window === 'undefined') return { road: null, start: null, finish: null };
    if (!cachedRoadImg) {
        cachedRoadImg = new Image();
        cachedRoadImg.src = ROAD_SRC;
    }
    if (!cachedStartImg) {
        cachedStartImg = new Image();
        cachedStartImg.src = START_SRC;
    }
    if (!cachedFinishImg) {
        cachedFinishImg = new Image();
        cachedFinishImg.src = FINISH_SRC;
    }
    return { road: cachedRoadImg, start: cachedStartImg, finish: cachedFinishImg };
}

/**
 * PixelRoadBg
 * High-performance, pixel-perfect continuous road renderer.
 * 
 * In 'race' mode:
 * Renders a true linear racing track:
 *   [START TILE] -> [NORMAL ROAD TILE x N] -> [FINISH TILE] -> [RUN-OFF]
 * Where N is calculated from the countdown duration so scrolling speed feels natural.
 * 
 * In 'loop' mode:
 * Renders an infinite seamless scrolling loop of pixel-road.png.
 */
export function PixelRoadBg({
    className = '',
    style,
    speedPxPerSec = 160,
    fixedDuration,
    mode = 'loop',
    progress = 0,
    totalSecs = 60,
    isRunning = false,
    isFinished = false,
    imageSrc,
    paused = false,
    showStartLine = true,
    showFinishLine = true,
}: PixelRoadBgProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const loopOffsetRef = useRef(0);
    const lastTimeRef = useRef<number | null>(null);

    // Keep props in refs for requestAnimationFrame loops without stale closures
    const propsRef = useRef({
        mode,
        progress,
        totalSecs,
        isRunning,
        isFinished,
        speedPxPerSec,
        fixedDuration,
        imageSrc,
        paused,
        showStartLine,
        showFinishLine,
    });
    propsRef.current = {
        mode,
        progress,
        totalSecs,
        isRunning,
        isFinished,
        speedPxPerSec,
        fixedDuration,
        imageSrc,
        paused,
        showStartLine,
        showFinishLine,
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { road, start, finish } = getCachedImages();

        let animId: number;
        let wView = canvas.parentElement?.clientWidth || canvas.clientWidth || 800;
        let hView = canvas.parentElement?.clientHeight || canvas.clientHeight || 432;
        canvas.width = wView;
        canvas.height = hView;

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const cr = entry.contentRect;
                if (cr.width > 0 && cr.height > 0) {
                    const nw = Math.round(cr.width);
                    const nh = Math.round(cr.height);
                    if (nw !== wView || nh !== hView) {
                        wView = nw;
                        hView = nh;
                        canvas.width = nw;
                        canvas.height = nh;
                    }
                }
            }
        });
        const observeTarget = canvas.parentElement || canvas;
        ro.observe(observeTarget);

        const renderFrame = (now: number) => {
            const p = propsRef.current;
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, wView, hView);

            // Aspect ratio of pixel road tiles is 3:1 (width = height * 3)
            const tileW = Math.round(hView * 3);

            if (p.mode === 'race') {
                // ── RACE MODE: Continuous linear track [Start -> Road x N -> Finish] ──
                const duration = Math.max(1, p.totalSecs || 60);
                const totalDist = p.speedPxPerSec * duration;
                // Calculate number of normal road tiles needed between start and finish
                const nRoadTiles = Math.max(1, Math.round((totalDist - tileW) / tileW));

                // Start line coordinate in start tile (scaled to current height)
                const xStartInTile = Math.round(255 * (hView / 724));
                // Finish line coordinate in finish tile (scaled to current height)
                const xFinishInTile = Math.round(255 * (hView / 725));
                // World coordinate of finish line
                const xFinishWorld = (nRoadTiles + 1) * tileW + xFinishInTile;

                // Screen positions:
                // At progress 0, start line sits naturally on screen (~280px)
                const xStartScreen = 280;
                // At progress 1, finish line sits on the right of the screen
                const xFinishScreen = Math.min(wView - 260, Math.max(280, wView * 0.75));

                const xCamStart = xStartInTile - xStartScreen;
                const xCamEnd = xFinishWorld - xFinishScreen;

                const curProgress = Math.max(0, Math.min(1, p.progress));

                // Smooth camera launch curve: accelerates smoothly from rest in ~3.5 seconds,
                // matching the cars' grid launch duration regardless of overall timer duration
                const tLaunch = Math.min(3.5, duration * 0.25);
                const L = Math.max(0.0001, tLaunch / duration);
                const M = 1 / (1 - L / 2);
                const a = M / (2 * L);
                const camProgress = curProgress <= L
                    ? a * curProgress * curProgress
                    : M * (curProgress - L / 2);

                const camX = xCamStart + Math.min(1, Math.max(0, camProgress)) * (xCamEnd - xCamStart);

                // Determine which tiles intersect the visible viewport
                const kMin = Math.floor(camX / tileW);
                const kMax = Math.floor((camX + wView) / tileW);

                for (let k = kMin; k <= kMax; k++) {
                    let imgToDraw = road;
                    if (k === 0 && (p.showStartLine !== false)) {
                        imgToDraw = start;
                    } else if (k === nRoadTiles + 1 && (p.showFinishLine !== false)) {
                        imgToDraw = finish;
                    } else {
                        imgToDraw = road;
                    }

                    if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
                        const drawX = Math.round(k * tileW - camX);
                        ctx.drawImage(imgToDraw, drawX, 0, tileW, hView);
                    }
                }
            } else {
                // ── LOOP MODE: Continuous infinite scroll (used in previews/cards) ──
                const dt = lastTimeRef.current ? Math.min(0.1, (now - lastTimeRef.current) / 1000) : 0;
                lastTimeRef.current = now;

                if (!p.paused) {
                    const speed = p.fixedDuration ? tileW / p.fixedDuration : p.speedPxPerSec;
                    loopOffsetRef.current = (loopOffsetRef.current + speed * dt) % tileW;
                }

                const offset = loopOffsetRef.current;
                const imgToDraw = road;

                if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
                    const startX = -offset;
                    for (let x = startX; x < wView; x += tileW) {
                        ctx.drawImage(imgToDraw, Math.round(x), 0, tileW, hView);
                    }
                }
            }

            animId = requestAnimationFrame(renderFrame);
        };

        // Redraw when cached images finish loading
        const onImgLoad = () => {
            if (canvas) renderFrame(performance.now());
        };
        [road, start, finish].forEach(img => {
            if (img && !img.complete) {
                img.addEventListener('load', onImgLoad);
            }
        });

        animId = requestAnimationFrame(renderFrame);

        return () => {
            cancelAnimationFrame(animId);
            ro.disconnect();
            [road, start, finish].forEach(img => {
                if (img) img.removeEventListener('load', onImgLoad);
            });
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`race-road-bg ${className}`}
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                display: 'block',
                pointerEvents: 'none',
                imageRendering: 'pixelated',
                ...style,
            }}
        />
    );
}

export default PixelRoadBg;
