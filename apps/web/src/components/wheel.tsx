import { type WheelManager } from '@repo/shared/classes/wheel-manager';
import { type Coordinates, Easing, RotationDirection } from '@repo/shared/types/wheel';
import {
    type FC,
    type MouseEvent as ReactMouseEvent,
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
import { handleMouseDown, handleMouseMove, handleMouseUp } from '@/utils/wheel-animation';

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

    const mousePos = useRef<Coordinates>({ x: 0, y: 0 });
    const rotationDirection = useRef<RotationDirection>(RotationDirection.None);
    const startMousePos = useRef<Coordinates>({ x: 0, y: 0 });
    const prevMousePos = useRef<Coordinates>({ x: 0, y: 0 });
    const prevMouseAngle = useRef(0);
    const rotationDifference = useRef(0);
    const rotationSpeed = useRef(0);
    const easing = useRef(Easing.Out);
    const mouseDown = useRef(false);
    const quickClick = useRef(false);
    const frameId = useRef<number>(undefined);
    const wheelRef: RefObject<HTMLDivElement | null> = useRef(null);

    const onMouseDown = useCallback(
        (event: ReactMouseEvent<HTMLDivElement, MouseEvent>) =>
            handleMouseDown(
                event,
                frameId,
                mouseDown,
                mousePos,
                quickClick,
                rotationDifference,
                startMousePos,
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
            handleMouseMove(
                event,
                mouseDown,
                mousePos,
                prevMouseAngle,
                prevMousePos,
                rotationDifference,
                rotationDirection,
                rotationSpeed,
                setHasWinner,
                wheelManager,
                wheelRef
            );

        if (!isStatic) {
            globalThis.addEventListener('mousemove', onMouseMove);

            return () => {
                globalThis.removeEventListener('mousemove', onMouseMove);
            };
        }
    }, [isStatic, setHasWinner, wheelManager]);

    useEffect(() => {
        const onMouseUp = (event: MouseEvent) =>
            handleMouseUp(
                event,
                easing,
                frameId,
                mouseDown,
                quickClick,
                rotationDirection,
                rotationSpeed,
                startMousePos,
                setHasWinner,
                setRotationBlur,
                setWillChange,
                wheelManager
            );

        if (!isStatic) {
            globalThis.addEventListener('mouseup', onMouseUp);

            return () => {
                globalThis.removeEventListener('mouseup', onMouseUp);
            };
        }
    }, [isStatic, setHasWinner, setRotationBlur, setWillChange, wheelManager]);

    return (
        <div
            ref={wheelRef}
            onMouseDown={onMouseDown}
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
