import { type WheelManager } from '@repo/shared/classes/wheel-manager';
import { type Coordinates, Easing, InteractionSource, RotationDirection } from '@repo/shared/types/wheel';
import {
    type FC,
    type MouseEvent as ReactMouseEvent,
    type TouchEvent as ReactTouchEvent,
    type RefObject,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { MemoizedWheelSegment } from '@/components/wheel-segment';
import { RotationContext } from '@/contexts/rotation';
import { SegmentContext } from '@/contexts/segment';
import { handlePointerDown, handlePointerMove, handlePointerUp } from '@/utils/wheel-animation';

interface WheelProps {
    wheelManager?: WheelManager;
    radius: string;
    isStatic?: boolean;
}

export const Wheel: FC<WheelProps> = ({ wheelManager, radius = '400px', isStatic = false }) => {
    const { rotation } = useContext(RotationContext);
    const { setHasWinner } = useContext(SegmentContext);

    const [rotationBlur, setRotationBlur] = useState(0);
    const [willChange, setWillChange] = useState(false);

    const pointerPos = useRef<Coordinates>({ x: 0, y: 0 });
    const rotationDirection = useRef<RotationDirection>(RotationDirection.None);
    const startPointerPos = useRef<Coordinates>({ x: 0, y: 0 });
    const prevPointerPos = useRef<Coordinates>({ x: 0, y: 0 });
    const prevPointerAngle = useRef(0);
    const rotationDifference = useRef(0);
    const rotationSpeed = useRef(0);
    const easing = useRef(Easing.Out);
    const pointerDown = useRef(false);
    const quickClick = useRef(false);
    const frameId = useRef<number>(undefined);
    const wheelRef: RefObject<HTMLDivElement | null> = useRef(null);

    const onMouseDown = useCallback(
        (event: ReactMouseEvent<HTMLDivElement, MouseEvent>) =>
            handlePointerDown(
                event,
                InteractionSource.Mouse,
                frameId,
                pointerDown,
                pointerPos,
                quickClick,
                rotationDifference,
                startPointerPos,
                rotation,
                setHasWinner,
                setRotationBlur,
                setWillChange,
                wheelRef
            ),
        [rotation, setHasWinner]
    );

    const onTouchStart = useCallback(
        (event: ReactTouchEvent<HTMLDivElement>) =>
            handlePointerDown(
                event,
                InteractionSource.Touch,
                frameId,
                pointerDown,
                pointerPos,
                quickClick,
                rotationDifference,
                startPointerPos,
                rotation,
                setHasWinner,
                setRotationBlur,
                setWillChange,
                wheelRef
            ),
        [rotation, setHasWinner]
    );

    useEffect(() => {
        const onMouseMove = (event: MouseEvent) =>
            handlePointerMove(
                event,
                InteractionSource.Mouse,
                pointerDown,
                pointerPos,
                prevPointerAngle,
                prevPointerPos,
                rotationDifference,
                rotationDirection,
                rotationSpeed,
                setHasWinner,
                wheelManager,
                wheelRef
            );

        const onTouchMove = (event: TouchEvent) =>
            handlePointerMove(
                event,
                InteractionSource.Touch,
                pointerDown,
                pointerPos,
                prevPointerAngle,
                prevPointerPos,
                rotationDifference,
                rotationDirection,
                rotationSpeed,
                setHasWinner,
                wheelManager,
                wheelRef
            );

        if (!isStatic) {
            globalThis.addEventListener('mousemove', onMouseMove);
            globalThis.addEventListener('touchmove', onTouchMove, { passive: false });

            return () => {
                globalThis.removeEventListener('mousemove', onMouseMove);
                globalThis.removeEventListener('touchmove', onTouchMove);
            };
        }
    }, [isStatic, setHasWinner, wheelManager]);

    useEffect(() => {
        const onMouseUp = (event: MouseEvent) =>
            handlePointerUp(
                event,
                InteractionSource.Mouse,
                easing,
                frameId,
                pointerDown,
                quickClick,
                rotationDirection,
                rotationSpeed,
                startPointerPos,
                setHasWinner,
                setRotationBlur,
                setWillChange,
                wheelManager
            );

        const onTouchEnd = (event: TouchEvent) =>
            handlePointerUp(
                event,
                InteractionSource.Touch,
                easing,
                frameId,
                pointerDown,
                quickClick,
                rotationDirection,
                rotationSpeed,
                startPointerPos,
                setHasWinner,
                setRotationBlur,
                setWillChange,
                wheelManager
            );

        if (!isStatic) {
            globalThis.addEventListener('mouseup', onMouseUp);
            globalThis.addEventListener('touchend', onTouchEnd);

            return () => {
                globalThis.removeEventListener('mouseup', onMouseUp);
                globalThis.removeEventListener('touchend', onTouchEnd);
            };
        }
    }, [isStatic, setHasWinner, setRotationBlur, setWillChange, wheelManager]);

    return (
        <div
            ref={wheelRef}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={`relative select-none overflow-hidden rounded-full ${isStatic ? '' : 'cursor-grab active:cursor-grabbing'}`}
            style={{
                width: radius,
                paddingTop: radius,
                clipPath: 'circle(50%)',
                transform: `rotate(${rotation ?? 0}deg)`,
                filter: `blur(0)`,
                willChange: willChange ? 'transform' : 'auto',
            }}
        >
            {wheelManager !== undefined &&
                wheelManager.segments.map((segment) => {
                    return <MemoizedWheelSegment key={segment.id} segment={segment} />;
                })}
            <div
                className="absolute left-0 top-0 size-full"
                style={{
                    backdropFilter: `blur(${rotationBlur}px)`,
                    maskImage: 'radial-gradient(transparent 10%, black 50%)',
                    willChange: willChange ? 'backdropFilter' : 'auto',
                }}
            />
        </div>
    );
};
