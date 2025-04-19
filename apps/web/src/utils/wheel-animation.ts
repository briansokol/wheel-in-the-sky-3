import { type Coordinates, InteractionSource } from '@repo/shared/types/wheel';
import { type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent, type RefObject } from 'react';

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
