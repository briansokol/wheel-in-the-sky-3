import { motion, useReducedMotion } from 'framer-motion';
import type { CSSProperties, JSX } from 'react';

interface GlowPosition {
    name: string;
    style: CSSProperties;
}

// Top-right, bottom-left and bottom-right, as in the approved mockup, scaled to the viewport.
const GLOW_POSITIONS: GlowPosition[] = [
    { name: 'top-right', style: { top: '-12vmax', right: '-8vmax', width: '48vmax', height: '48vmax', opacity: 0.75 } },
    {
        name: 'bottom-left',
        style: { bottom: '4vmax', left: '-14vmax', width: '40vmax', height: '40vmax', opacity: 0.6 },
    },
    {
        name: 'bottom-right',
        style: { bottom: '-14vmax', right: '8vmax', width: '36vmax', height: '36vmax', opacity: 0.55 },
    },
];

/**
 * Soft, heavily blurred color glows fixed behind the page content. Colors tween when they change.
 */
export function WheelGlows({ colors }: { colors: string[] }): JSX.Element {
    const reduceMotion = useReducedMotion();

    return (
        <div
            aria-hidden="true"
            data-testid="wheel-glows"
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
            {colors.map((color, index) => {
                const position = GLOW_POSITIONS[index % GLOW_POSITIONS.length];
                return (
                    <motion.div
                        key={position.name}
                        data-testid="wheel-glow"
                        data-color={color}
                        className="absolute rounded-full blur-[80px]"
                        style={position.style}
                        initial={false}
                        animate={{ backgroundColor: color }}
                        transition={{ duration: reduceMotion ? 0 : 0.6, ease: 'easeInOut' }}
                    />
                );
            })}
        </div>
    );
}
