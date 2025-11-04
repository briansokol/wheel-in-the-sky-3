import { type WheelManager } from '@repo/shared/classes/wheel-manager';
import { InteractionSource } from '@repo/shared/types/wheel';
import {
    type FC,
    type MouseEvent as ReactMouseEvent,
    type TouchEvent as ReactTouchEvent,
    type RefObject,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { MemoizedWheelSegment } from '@/components/wheel-segment';
import { useRotation } from '@/contexts/rotation';
import { useSegment } from '@/contexts/segment';
import { WheelAnimationManager } from '@/utils/wheel-animation-manager';

/**
 * Props for the Wheel component
 */
interface WheelProps {
    wheelManager?: WheelManager;
    diameter: string;
    isStatic?: boolean;
}

/**
 * Wheel component that displays a spinning wheel with segments
 *
 * The wheel animation is managed outside of React's render cycle by WheelAnimationManager
 */
export const Wheel: FC<WheelProps> = ({ wheelManager, diameter = '400px', isStatic = false }) => {
    const { setRotation } = useRotation();
    const { setHasWinner } = useSegment();

    // Reference to the wheel DOM element
    const wheelRef: RefObject<HTMLDivElement | null> = useRef(null);

    // Reference to the wheel blur overlay
    const wheelBlurRef: RefObject<HTMLDivElement | null> = useRef(null);

    // Reference to the animation manager instance
    const animationManagerRef = useRef<WheelAnimationManager | null>(null);

    // Create or update the animation manager when dependencies change
    useEffect(() => {
        if (!animationManagerRef.current) {
            // Create the animation manager with callbacks to update React state
            animationManagerRef.current = new WheelAnimationManager(wheelManager, wheelRef, wheelBlurRef, {
                onWinnerStateChange: (newHasWinner, newRotation) => {
                    setHasWinner?.(newHasWinner);
                    setRotation?.(newRotation);
                },
            });
        }

        // Clean up the animation manager when component unmounts
        return () => {
            if (animationManagerRef.current) {
                animationManagerRef.current.destroy();
                animationManagerRef.current = null;
            }
        };
    }, [wheelManager, setRotation, setHasWinner]); // setRotation and setHasWinner are now stable from memoized context

    // Event handlers that delegate to the animation manager
    const onMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
        if (animationManagerRef.current) {
            animationManagerRef.current.handlePointerDown(event, InteractionSource.Mouse);
        }
    }, []);

    const onTouchStart = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
        if (animationManagerRef.current) {
            animationManagerRef.current.handlePointerDown(event, InteractionSource.Touch);
        }
    }, []);

    // Set up global mouse/touch event listeners
    // Combines move and up event handlers into a single effect for better performance
    useEffect(() => {
        if (isStatic || !animationManagerRef.current) return;

        // Define move event handlers that delegate to the animation manager
        const onMouseMove = (event: MouseEvent) => {
            if (animationManagerRef.current) {
                animationManagerRef.current.handlePointerMove(event, InteractionSource.Mouse);
            }
        };

        const onTouchMove = (event: TouchEvent) => {
            if (animationManagerRef.current) {
                animationManagerRef.current.handlePointerMove(event, InteractionSource.Touch);
            }
        };

        // Define up event handlers that delegate to the animation manager
        const onMouseUp = (event: MouseEvent) => {
            if (animationManagerRef.current) {
                animationManagerRef.current.handlePointerUp(event, InteractionSource.Mouse);
            }
        };

        const onTouchEnd = (event: TouchEvent) => {
            if (animationManagerRef.current) {
                animationManagerRef.current.handlePointerUp(event, InteractionSource.Touch);
            }
        };

        // Add all event listeners
        globalThis.addEventListener('mousemove', onMouseMove);
        globalThis.addEventListener('touchmove', onTouchMove, { passive: false });
        globalThis.addEventListener('mouseup', onMouseUp);
        globalThis.addEventListener('touchend', onTouchEnd);

        // Clean up all event listeners
        return () => {
            globalThis.removeEventListener('mousemove', onMouseMove);
            globalThis.removeEventListener('touchmove', onTouchMove);
            globalThis.removeEventListener('mouseup', onMouseUp);
            globalThis.removeEventListener('touchend', onTouchEnd);
        };
    }, [isStatic]);

    return (
        <div
            ref={wheelRef}
            role="application"
            aria-label="Prize wheel"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={0}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={`relative overflow-hidden rounded-full select-none ${isStatic ? '' : 'cursor-grab active:cursor-grabbing'}`}
            style={{
                width: diameter,
                paddingTop: diameter,
                clipPath: 'circle(50%)',
                filter: `blur(0)`,
                transform: 'rotate(0deg)',
                willChange: 'auto',
            }}
        >
            {wheelManager !== undefined &&
                wheelManager.segments.map((segment) => {
                    return (
                        <MemoizedWheelSegment
                            key={segment.id}
                            segment={segment}
                            showName={wheelManager.config.showNames}
                        />
                    );
                })}
            <div
                ref={wheelBlurRef}
                data-testid="wheel-blur"
                className="absolute top-0 left-0 size-full"
                style={{
                    backdropFilter: `blur(0px)`,
                    // maskImage: 'radial-gradient(transparent 10%, black 50%)',
                    willChange: 'auto',
                }}
            />
        </div>
    );
};
