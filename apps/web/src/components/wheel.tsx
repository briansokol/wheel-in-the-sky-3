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
import { WheelSegment } from '@/components/wheel-segment';
import { RotationContext } from '@/contexts/rotation';
import { SegmentContext } from '@/contexts/segment';

interface WheelProps {
    wheelManager?: WheelManager;
    radius: string;
    isStatic?: boolean;
}

const MAX_SPEED = 30;
const MIN_SPEED = 0.1;
const MAX_BLUR = 10;

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

    const getMouseAngle = useCallback(
        (mousePos: Coordinates): number => {
            const wheelPosition = wheelRef?.current?.getBoundingClientRect();
            if (!wheelPosition) {
                return 0;
            }

            const diffX = wheelPosition.left + wheelPosition.width / 2 - mousePos.x;
            const diffY = wheelPosition.top + wheelPosition.height / 2 - mousePos.y;

            return (Math.atan2(diffY, diffX) * 180) / Math.PI + 180;
        },
        [wheelRef]
    );

    const animate = useCallback(() => {
        if (wheelManager == undefined) {
            return;
        }
        if (rotationSpeed.current > 0.02) {
            wheelManager.setRotation((rotation) => {
                let newRotation = rotation + rotationSpeed.current * rotationDirection.current;
                if (newRotation < 0) {
                    newRotation += 360;
                } else if (newRotation >= 360) {
                    newRotation -= 360;
                }
                return newRotation;
            });
            rotationSpeed.current *= easing.current === Easing.In ? 1.01 : 0.99;

            setRotationBlur(
                rotationSpeed.current <= MIN_SPEED
                    ? 0
                    : rotationSpeed.current >= MAX_SPEED
                      ? MAX_BLUR
                      : ((rotationSpeed.current - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * MAX_BLUR
            );
            frameId.current = requestAnimationFrame(animate);
        } else {
            setRotationBlur(0);
            frameId.current = undefined;
            rotationSpeed.current = 0;
            if (setHasWinner) {
                setHasWinner(true);
            }
            setWillChange(false);
        }
    }, [setHasWinner, wheelManager, setWillChange]);

    const handleMouseDown = useCallback(
        (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
            setWillChange(true);
            quickClick.current = true;
            setRotationBlur(0);
            setTimeout(() => {
                quickClick.current = false;
            }, 500);
            mouseDown.current = true;
            rotationDifference.current = rotation - getMouseAngle(mousePos.current);
            mousePos.current = { x: e.clientX, y: e.clientY };
            startMousePos.current = { x: e.clientX, y: e.clientY };
            if (frameId.current) {
                cancelAnimationFrame(frameId.current);
                frameId.current = undefined;
            }
            if (setHasWinner) {
                setHasWinner(false);
            }
        },
        [rotation, getMouseAngle, setHasWinner, setWillChange]
    );

    const handleMouseUp = useCallback(
        (e: MouseEvent) => {
            if (mouseDown.current) {
                mouseDown.current = false;
                if (e.clientX !== startMousePos.current.x || e.clientY !== startMousePos.current.y) {
                    easing.current = Easing.Out;
                    frameId.current = requestAnimationFrame(animate);
                } else if (quickClick.current) {
                    easing.current = Easing.In;
                    rotationSpeed.current = 0.8;
                    rotationDirection.current = RotationDirection.CounterClockwise;
                    frameId.current = requestAnimationFrame(animate);
                    setTimeout(() => {
                        rotationSpeed.current = 30 + Math.random() * 20;
                        rotationDirection.current = RotationDirection.Clockwise;
                        setTimeout(() => {
                            easing.current = Easing.Out;
                        }, 400);
                    }, 400);
                } else {
                    setRotationBlur(0);
                    setWillChange(false);
                    rotationSpeed.current = 0;
                    if (frameId.current) {
                        cancelAnimationFrame(frameId.current);
                        frameId.current = undefined;
                    }
                }
            }
        },
        [animate]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (wheelManager == undefined) {
                return;
            }

            prevMousePos.current = mousePos.current;
            mousePos.current = { x: e.clientX, y: e.clientY };

            if (!mouseDown.current) {
                return;
            }

            if (setHasWinner) {
                setHasWinner(false);
            }

            const mouseAngle = getMouseAngle(mousePos.current);
            if (mouseAngle > prevMouseAngle.current || prevMouseAngle.current - mouseAngle > 180) {
                rotationDirection.current = RotationDirection.Clockwise;
            } else if (mouseAngle < prevMouseAngle.current || mouseAngle - prevMouseAngle.current > 180) {
                rotationDirection.current = RotationDirection.CounterClockwise;
            } else {
                rotationDirection.current = RotationDirection.None;
            }
            prevMouseAngle.current = mouseAngle;

            const speed = Math.hypot(
                mousePos.current.x - prevMousePos.current.x,
                mousePos.current.y - prevMousePos.current.y
            );
            rotationSpeed.current = speed * 0.5;

            let newRotation: number = mouseAngle + rotationDifference.current;
            if (newRotation < 0) {
                newRotation += 360;
            } else if (newRotation >= 360) {
                newRotation -= 360;
            }
            wheelManager.setRotation(newRotation);
        },
        [getMouseAngle, setHasWinner, wheelManager]
    );

    useEffect(() => {
        if (!isStatic) {
            globalThis.addEventListener('mousemove', handleMouseMove);

            return () => {
                globalThis.removeEventListener('mousemove', handleMouseMove);
            };
        }
    }, [isStatic, handleMouseMove]);

    useEffect(() => {
        if (!isStatic) {
            globalThis.addEventListener('mouseup', handleMouseUp);

            return () => {
                globalThis.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isStatic, handleMouseUp]);

    return (
        <div
            ref={wheelRef}
            onMouseDown={(e) => handleMouseDown(e)}
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
                    return <WheelSegment key={segment.id} segment={segment} />;
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
