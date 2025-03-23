import { type WheelManager } from '@repo/shared/classes/wheel-manager';
import { type Coordinates, Easing, RotationDirection } from '@repo/shared/types/wheel';
import { type Dispatch, type MouseEvent as ReactMouseEvent, type RefObject, type SetStateAction } from 'react';

const MAX_SPEED = 30;
const MIN_SPEED = 0.1;
const MAX_BLUR = 10;

export function getMouseAngle(mousePos: Coordinates, wheelRef: RefObject<HTMLDivElement | null>): number {
    const wheelPosition = wheelRef?.current?.getBoundingClientRect();

    if (!wheelPosition) {
        return 0;
    }

    const diffX = wheelPosition.left + wheelPosition.width / 2 - mousePos.x;
    const diffY = wheelPosition.top + wheelPosition.height / 2 - mousePos.y;

    return (Math.atan2(diffY, diffX) * 180) / Math.PI + 180;
}

export function animate(
    easing: RefObject<Easing>,
    frameId: RefObject<number | undefined>,
    rotationDirection: RefObject<RotationDirection>,
    rotationSpeed: RefObject<number>,
    setHasWinner: Dispatch<SetStateAction<boolean>> | undefined,
    setRotationBlur: Dispatch<SetStateAction<number>>,
    setWillChange: Dispatch<SetStateAction<boolean>>,
    wheelManager: WheelManager | undefined
): void {
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
        frameId.current = requestAnimationFrame(() =>
            animate(
                easing,
                frameId,
                rotationDirection,
                rotationSpeed,
                setHasWinner,
                setRotationBlur,
                setWillChange,
                wheelManager
            )
        );
    } else {
        setRotationBlur(0);
        frameId.current = undefined;
        rotationSpeed.current = 0;
        if (setHasWinner) {
            setHasWinner(true);
        }
        setWillChange(false);
    }
}

export function handleMouseDown(
    event: ReactMouseEvent<HTMLDivElement, MouseEvent>,
    frameId: RefObject<number | undefined>,
    mouseDown: RefObject<boolean>,
    mousePos: RefObject<Coordinates>,
    quickClick: RefObject<boolean>,
    rotationDifference: RefObject<number>,
    startMousePos: RefObject<Coordinates>,
    rotation: number,
    setHasWinner: Dispatch<SetStateAction<boolean>> | undefined,
    setRotationBlur: Dispatch<SetStateAction<number>>,
    setWillChange: Dispatch<SetStateAction<boolean>>,
    wheelRef: RefObject<HTMLDivElement | null>
): void {
    setWillChange(true);
    quickClick.current = true;
    setRotationBlur(0);
    setTimeout(() => {
        quickClick.current = false;
    }, 500);
    mouseDown.current = true;
    rotationDifference.current = rotation - getMouseAngle(mousePos.current, wheelRef);
    mousePos.current = { x: event.clientX, y: event.clientY };
    startMousePos.current = { x: event.clientX, y: event.clientY };
    if (frameId.current) {
        cancelAnimationFrame(frameId.current);
        frameId.current = undefined;
    }
    if (setHasWinner) {
        setHasWinner(false);
    }
}

export function handleMouseUp(
    event: MouseEvent,
    easing: RefObject<Easing>,
    frameId: RefObject<number | undefined>,
    mouseDown: RefObject<boolean>,
    quickClick: RefObject<boolean>,
    rotationDirection: RefObject<RotationDirection>,
    rotationSpeed: RefObject<number>,
    startMousePos: RefObject<Coordinates>,
    setHasWinner: Dispatch<SetStateAction<boolean>> | undefined,
    setRotationBlur: Dispatch<SetStateAction<number>>,
    setWillChange: Dispatch<SetStateAction<boolean>>,
    wheelManager: WheelManager | undefined
) {
    if (mouseDown.current) {
        mouseDown.current = false;
        if (event.clientX !== startMousePos.current.x || event.clientY !== startMousePos.current.y) {
            easing.current = Easing.Out;
            frameId.current = requestAnimationFrame(() =>
                animate(
                    easing,
                    frameId,
                    rotationDirection,
                    rotationSpeed,
                    setHasWinner,
                    setRotationBlur,
                    setWillChange,
                    wheelManager
                )
            );
        } else if (quickClick.current) {
            easing.current = Easing.In;
            rotationSpeed.current = 0.8;
            rotationDirection.current = RotationDirection.CounterClockwise;
            frameId.current = requestAnimationFrame(() =>
                animate(
                    easing,
                    frameId,
                    rotationDirection,
                    rotationSpeed,
                    setHasWinner,
                    setRotationBlur,
                    setWillChange,
                    wheelManager
                )
            );
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
}

export function handleMouseMove(
    event: MouseEvent,
    mouseDown: RefObject<boolean>,
    mousePos: RefObject<Coordinates>,
    prevMouseAngle: RefObject<number>,
    prevMousePos: RefObject<Coordinates>,
    rotationDifference: RefObject<number>,
    rotationDirection: RefObject<RotationDirection>,
    rotationSpeed: RefObject<number>,
    setHasWinner: Dispatch<SetStateAction<boolean>> | undefined,
    wheelManager: WheelManager | undefined,
    wheelRef: RefObject<HTMLDivElement | null>
) {
    if (wheelManager == undefined) {
        return;
    }

    prevMousePos.current = mousePos.current;
    mousePos.current = { x: event.clientX, y: event.clientY };

    if (!mouseDown.current) {
        return;
    }

    if (setHasWinner) {
        setHasWinner(false);
    }

    const mouseAngle = getMouseAngle(mousePos.current, wheelRef);
    if (mouseAngle > prevMouseAngle.current || prevMouseAngle.current - mouseAngle > 180) {
        rotationDirection.current = RotationDirection.Clockwise;
    } else if (mouseAngle < prevMouseAngle.current || mouseAngle - prevMouseAngle.current > 180) {
        rotationDirection.current = RotationDirection.CounterClockwise;
    } else {
        rotationDirection.current = RotationDirection.None;
    }
    prevMouseAngle.current = mouseAngle;

    const speed = Math.hypot(mousePos.current.x - prevMousePos.current.x, mousePos.current.y - prevMousePos.current.y);
    rotationSpeed.current = speed * 0.5;

    let newRotation: number = mouseAngle + rotationDifference.current;
    if (newRotation < 0) {
        newRotation += 360;
    } else if (newRotation >= 360) {
        newRotation -= 360;
    }
    wheelManager.setRotation(newRotation);
}
