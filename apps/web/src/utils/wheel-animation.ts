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
 * @param pointerPos - The coordinates of the mouse or touch point
 * @param wheelRef - Reference to the wheel element
 * @returns The angle in degrees
 */
export function getPointerAngle(pointerPos: Coordinates, wheelRef: RefObject<HTMLDivElement | null>): number {
    const wheelPosition = wheelRef?.current?.getBoundingClientRect();

    if (!wheelPosition) {
        return 0;
    }

    const diffX = wheelPosition.left + wheelPosition.width / 2 - pointerPos.x;
    const diffY = wheelPosition.top + wheelPosition.height / 2 - pointerPos.y;

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
 * Extracts coordinates from a pointer event
 * @param event - The pointer event (mouse or touch)
 * @param interactionSource - The source of the interaction (mouse or touch)
 * @returns Coordinates object with x and y properties
 */
export function getCoordinatesFromPointerEvent(
    event: TouchEvent | ReactTouchEvent | MouseEvent | ReactMouseEvent,
    interactionSource: InteractionSource
): Coordinates | null {
    let coordinates: Coordinates | null = null;

    if (interactionSource === InteractionSource.Mouse) {
        coordinates = getCoordinatesFromMouseEvent(event as MouseEvent);
    } else if (interactionSource === InteractionSource.Touch) {
        coordinates = getCoordinatesFromTouchEvent(event as TouchEvent);
    }

    return coordinates;
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
 * @param pointerDown - Reference tracking if mouse/touch is down
 * @param pointerPos - Reference to the current mouse/touch position
 * @param quickClick - Reference tracking if it's a quick click/tap
 * @param rotationDifference - Reference to the rotation difference
 * @param startPointerPos - Reference to the starting mouse/touch position
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
    pointerDown: RefObject<boolean>,
    pointerPos: RefObject<Coordinates>,
    quickClick: RefObject<boolean>,
    rotationDifference: RefObject<number>,
    startPointerPos: RefObject<Coordinates>,
    rotation: number,
    setHasWinner: Dispatch<SetStateAction<boolean>> | undefined,
    setRotationBlur: Dispatch<SetStateAction<number>>,
    setWillChange: Dispatch<SetStateAction<boolean>>,
    wheelRef: RefObject<HTMLDivElement | null>
): void {
    // Prevent default to avoid scrolling while spinning the wheel
    event.preventDefault();

    const coordinates = getCoordinatesFromPointerEvent(event, interactionSource);

    if (!coordinates) {
        return;
    }

    setWillChange(true);
    quickClick.current = true;
    setRotationBlur(0);
    setTimeout(() => {
        quickClick.current = false;
    }, 500);
    pointerDown.current = true;
    rotationDifference.current = rotation - getPointerAngle(pointerPos.current, wheelRef);
    pointerPos.current = coordinates;
    startPointerPos.current = coordinates;
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
 * @param event - The mouse or touch event
 * @param interactionSource - The source of the interaction (mouse or touch)
 * @param easing - Reference to the current easing type
 * @param frameId - Reference to the animation frame ID
 * @param pointerDown - Reference tracking if mouse/touch is down
 * @param quickClick - Reference tracking if it's a quick click/tap
 * @param rotationDirection - Reference to the current rotation direction
 * @param rotationSpeed - Reference to the current rotation speed
 * @param startPointerPos - Reference to the starting mouse/touch position
 * @param setHasWinner - Function to set whether there is a winner
 * @param setRotationBlur - Function to set the rotation blur effect
 * @param setWillChange - Function to set CSS will-change property
 * @param wheelManager - The wheel manager instance
 */
export function handlePointerUp(
    event: MouseEvent | ReactMouseEvent | TouchEvent | ReactTouchEvent,
    interactionSource: InteractionSource,
    easing: RefObject<Easing>,
    frameId: RefObject<number | undefined>,
    pointerDown: RefObject<boolean>,
    quickClick: RefObject<boolean>,
    rotationDirection: RefObject<RotationDirection>,
    rotationSpeed: RefObject<number>,
    startPointerPos: RefObject<Coordinates>,
    setHasWinner: Dispatch<SetStateAction<boolean>> | undefined,
    setRotationBlur: Dispatch<SetStateAction<number>>,
    setWillChange: Dispatch<SetStateAction<boolean>>,
    wheelManager: WheelManager | undefined
) {
    if (wheelManager == undefined) {
        return;
    }

    const coordinates = getCoordinatesFromPointerEvent(event, interactionSource);

    if (!coordinates) {
        return;
    }

    if (pointerDown.current) {
        pointerDown.current = false;
        if (coordinates.x !== startPointerPos.current.x || coordinates.y !== startPointerPos.current.y) {
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
 * Handles mouse or touch move events
 * @param event - The mouse or touch event
 * @param interactionSource - The source of the interaction (mouse or touch)
 * @param pointerDown - Reference tracking if mouse/touch is down
 * @param pointerPos - Reference to the current mouse/touch position
 * @param prevPointerAngle - Reference to the previous mouse/touch angle
 * @param prevPointerPos - Reference to the previous mouse/touch position
 * @param rotationDifference - Reference to the rotation difference
 * @param rotationDirection - Reference to the current rotation direction
 * @param rotationSpeed - Reference to the current rotation speed
 * @param setHasWinner - Function to set whether there is a winner
 * @param wheelManager - The wheel manager instance
 * @param wheelRef - Reference to the wheel element
 */
export function handlePointerMove(
    event: MouseEvent | ReactMouseEvent | TouchEvent | ReactTouchEvent,
    interactionSource: InteractionSource,
    pointerDown: RefObject<boolean>,
    pointerPos: RefObject<Coordinates>,
    prevPointerAngle: RefObject<number>,
    prevPointerPos: RefObject<Coordinates>,
    rotationDifference: RefObject<number>,
    rotationDirection: RefObject<RotationDirection>,
    rotationSpeed: RefObject<number>,
    setHasWinner: Dispatch<SetStateAction<boolean>> | undefined,
    wheelManager: WheelManager | undefined,
    wheelRef: RefObject<HTMLDivElement | null>
) {
    // Prevent default to avoid scrolling while spinning the wheel
    event.preventDefault();

    if (wheelManager == undefined) {
        return;
    }

    const coordinates = getCoordinatesFromPointerEvent(event, interactionSource);

    if (!coordinates) {
        return;
    }

    prevPointerPos.current = pointerPos.current;
    pointerPos.current = coordinates;

    if (!pointerDown.current) {
        return;
    }

    if (setHasWinner) {
        setHasWinner(false);
    }

    const pointerAngle = getPointerAngle(pointerPos.current, wheelRef);
    if (pointerAngle > prevPointerAngle.current || prevPointerAngle.current - pointerAngle > 180) {
        rotationDirection.current = RotationDirection.Clockwise;
    } else if (pointerAngle < prevPointerAngle.current || pointerAngle - prevPointerAngle.current > 180) {
        rotationDirection.current = RotationDirection.CounterClockwise;
    } else {
        rotationDirection.current = RotationDirection.None;
    }
    prevPointerAngle.current = pointerAngle;

    const speed = Math.hypot(
        pointerPos.current.x - prevPointerPos.current.x,
        pointerPos.current.y - prevPointerPos.current.y
    );
    rotationSpeed.current = speed * 0.5;

    let newRotation: number = pointerAngle + rotationDifference.current;
    if (newRotation < 0) {
        newRotation += 360;
    } else if (newRotation >= 360) {
        newRotation -= 360;
    }
    wheelManager.setRotation(newRotation);
}
