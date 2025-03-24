import { type WheelManager } from '@repo/shared/classes/wheel-manager';
import { type Coordinates, Easing, InteractionSource, RotationDirection } from '@repo/shared/types/wheel';
import {
    type Dispatch,
    type MouseEvent as ReactMouseEvent,
    type TouchEvent as ReactTouchEvent,
    type RefObject,
    type SetStateAction,
} from 'react';

const MAX_SPEED = 30;
const MIN_SPEED = 0.1;
const MAX_BLUR = 10;

/**
 * Calculates the angle between the mouse/touch position and the center of the wheel
 * @param mousePos - The coordinates of the mouse or touch point
 * @param wheelRef - Reference to the wheel element
 * @returns The angle in degrees
 */
export function getMouseAngle(mousePos: Coordinates, wheelRef: RefObject<HTMLDivElement | null>): number {
    const wheelPosition = wheelRef?.current?.getBoundingClientRect();

    if (!wheelPosition) {
        return 0;
    }

    const diffX = wheelPosition.left + wheelPosition.width / 2 - mousePos.x;
    const diffY = wheelPosition.top + wheelPosition.height / 2 - mousePos.y;

    return (Math.atan2(diffY, diffX) * 180) / Math.PI + 180;
}

/**
 * Extracts coordinates from a mouse event
 * @param event - The mouse event
 * @returns Coordinates object with x and y properties
 */
export function getCoordinatesFromMouseEvent(event: MouseEvent | ReactMouseEvent): Coordinates {
    return { x: event.clientX, y: event.clientY };
}

/**
 * Extracts coordinates from a touch event
 * @param event - The touch event
 * @returns Coordinates object with x and y properties
 */
export function getCoordinatesFromTouchEvent(event: TouchEvent | ReactTouchEvent): Coordinates {
    if (event.touches.length === 0) {
        // Use changedTouches for touchend events
        return event.changedTouches.length > 0
            ? { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
            : { x: 0, y: 0 };
    }
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
}

/**
 * Animates the wheel rotation with easing
 * @param easing - Reference to the current easing type
 * @param frameId - Reference to the animation frame ID
 * @param rotationDirection - Reference to the current rotation direction
 * @param rotationSpeed - Reference to the current rotation speed
 * @param setHasWinner - Function to set whether there is a winner
 * @param setRotationBlur - Function to set the rotation blur effect
 * @param setWillChange - Function to set CSS will-change property
 * @param wheelManager - The wheel manager instance
 */
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

/**
 * Handles mouse down or touch start events on the wheel
 * @param event - The mouse or touch event
 * @param interactionSource - The source of the interaction (mouse or touch)
 * @param coordinates - The coordinates of the mouse or touch point
 * @param frameId - Reference to the animation frame ID
 * @param mouseDown - Reference tracking if mouse/touch is down
 * @param mousePos - Reference to the current mouse/touch position
 * @param quickClick - Reference tracking if it's a quick click/tap
 * @param rotationDifference - Reference to the rotation difference
 * @param startMousePos - Reference to the starting mouse/touch position
 * @param rotation - Current wheel rotation
 * @param setHasWinner - Function to set whether there is a winner
 * @param setRotationBlur - Function to set the rotation blur effect
 * @param setWillChange - Function to set CSS will-change property
 * @param wheelRef - Reference to the wheel element
 */
export function handlePointerDown(
    event: MouseEvent | ReactMouseEvent | TouchEvent | ReactTouchEvent,
    interactionSource: InteractionSource,
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
    let coordinates: Coordinates | null = null;

    if (interactionSource === InteractionSource.Mouse) {
        coordinates = getCoordinatesFromMouseEvent(event as MouseEvent);
    } else if (interactionSource === InteractionSource.Touch) {
        coordinates = getCoordinatesFromTouchEvent(event as TouchEvent);
    }

    if (!coordinates) {
        return;
    }

    setWillChange(true);
    quickClick.current = true;
    setRotationBlur(0);
    setTimeout(() => {
        quickClick.current = false;
    }, 500);
    mouseDown.current = true;
    rotationDifference.current = rotation - getMouseAngle(mousePos.current, wheelRef);
    mousePos.current = coordinates;
    startMousePos.current = coordinates;
    if (frameId.current) {
        cancelAnimationFrame(frameId.current);
        frameId.current = undefined;
    }
    if (setHasWinner) {
        setHasWinner(false);
    }
}

/**
 * Handles mouse up or touch end events
 * @param coordinates - The coordinates of the mouse or touch point
 * @param easing - Reference to the current easing type
 * @param frameId - Reference to the animation frame ID
 * @param mouseDown - Reference tracking if mouse/touch is down
 * @param quickClick - Reference tracking if it's a quick click/tap
 * @param rotationDirection - Reference to the current rotation direction
 * @param rotationSpeed - Reference to the current rotation speed
 * @param startMousePos - Reference to the starting mouse/touch position
 * @param setHasWinner - Function to set whether there is a winner
 * @param setRotationBlur - Function to set the rotation blur effect
 * @param setWillChange - Function to set CSS will-change property
 * @param wheelManager - The wheel manager instance
 */
export function handlePointerUp(
    coordinates: Coordinates,
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
        if (coordinates.x !== startMousePos.current.x || coordinates.y !== startMousePos.current.y) {
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

/**
 * Legacy function to handle mouse up events (uses handlePointerUp)
 */
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
    handlePointerUp(
        getCoordinatesFromMouseEvent(event),
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
}

/**
 * Handles touch end events (uses handlePointerUp)
 */
export function handleTouchEnd(
    event: TouchEvent,
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
    handlePointerUp(
        getCoordinatesFromTouchEvent(event),
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
}

/**
 * Handles mouse or touch move events
 * @param coordinates - The coordinates of the mouse or touch point
 * @param mouseDown - Reference tracking if mouse/touch is down
 * @param mousePos - Reference to the current mouse/touch position
 * @param prevMouseAngle - Reference to the previous mouse/touch angle
 * @param prevMousePos - Reference to the previous mouse/touch position
 * @param rotationDifference - Reference to the rotation difference
 * @param rotationDirection - Reference to the current rotation direction
 * @param rotationSpeed - Reference to the current rotation speed
 * @param setHasWinner - Function to set whether there is a winner
 * @param wheelManager - The wheel manager instance
 * @param wheelRef - Reference to the wheel element
 */
export function handlePointerMove(
    coordinates: Coordinates,
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
    mousePos.current = coordinates;

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

/**
 * Legacy function to handle mouse move events (uses handlePointerMove)
 */
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
    handlePointerMove(
        getCoordinatesFromMouseEvent(event),
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
}

/**
 * Handles touch move events (uses handlePointerMove)
 */
export function handleTouchMove(
    event: TouchEvent,
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
    // Prevent default to avoid scrolling while spinning the wheel
    event.preventDefault();
    handlePointerMove(
        getCoordinatesFromTouchEvent(event),
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
}
