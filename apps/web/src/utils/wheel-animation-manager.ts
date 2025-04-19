import { type WheelManager } from '@repo/shared/classes/wheel-manager';
import { type Coordinates, Easing, InteractionSource, RotationDirection } from '@repo/shared/types/wheel';
import { type RefObject } from 'react';
import { getCoordinatesFromPointerEvent, getPointerAngle } from './wheel-animation';

const MAX_SPEED = 30;
const MIN_SPEED = 0.1;
const MAX_BLUR = 10;

/**
 * Interface for animation state change callbacks
 */
export interface AnimationStateCallbacks {
    onRotationChange: (rotation: number) => void;
    onBlurChange: (blur: number) => void;
    onWillChangeUpdate: (willChange: boolean) => void;
    onWinnerStateChange: (hasWinner: boolean) => void;
}

/**
 * Manages wheel animation outside of React's render cycle
 *
 * This class is responsible for handling all animation calculations
 * and notifying React only when there are state changes that affect the UI
 */
export class WheelAnimationManager {
    // Private properties for animation state
    private _frameId: number | undefined;
    private _pointerDown = false;
    private _quickClick = false;
    private _pointerPos: Coordinates = { x: 0, y: 0 };
    private _rotationDirection: RotationDirection = RotationDirection.None;
    private _startPointerPos: Coordinates = { x: 0, y: 0 };
    private _prevPointerPos: Coordinates = { x: 0, y: 0 };
    private _prevPointerAngle = 0;
    private _rotationDifference = 0;
    private _rotationSpeed = 0;
    private _easing: Easing = Easing.Out;
    private _rotation = 0;
    private _rotationBlur = 0;
    private _willChange = false;
    private _hasWinner = false;

    /**
     * Creates a new WheelAnimationManager instance
     *
     * @param wheelManager - The wheel manager instance that controls the wheel state
     * @param wheelRef - Reference to the wheel DOM element
     * @param callbacks - Callbacks to notify React of state changes
     */
    constructor(
        private readonly _wheelManager: WheelManager | undefined,
        private readonly _wheelRef: RefObject<HTMLDivElement | null>,
        private readonly _callbacks: AnimationStateCallbacks
    ) {}

    /**
     * Getter for rotation value
     */
    public get rotation(): number {
        return this._rotation;
    }

    /**
     * Updates the rotation value and notifies React
     */
    private set rotation(value: number) {
        this._rotation = value;

        // Update the wheel manager and notify React
        if (this._wheelManager) {
            this._wheelManager.setRotation(value);
        }

        this._callbacks.onRotationChange(value);
    }

    /**
     * Getter for rotation blur value
     */
    public get rotationBlur(): number {
        return this._rotationBlur;
    }

    /**
     * Updates the rotation blur value and notifies React
     */
    private set rotationBlur(value: number) {
        this._rotationBlur = value;
        this._callbacks.onBlurChange(value);
    }

    /**
     * Getter for willChange CSS optimization flag
     */
    public get willChange(): boolean {
        return this._willChange;
    }

    /**
     * Updates the willChange flag and notifies React
     */
    private set willChange(value: boolean) {
        this._willChange = value;
        this._callbacks.onWillChangeUpdate(value);
    }

    /**
     * Getter for hasWinner state
     */
    public get hasWinner(): boolean {
        return this._hasWinner;
    }

    /**
     * Updates the hasWinner state and notifies React
     */
    private set hasWinner(value: boolean) {
        this._hasWinner = value;
        this._callbacks.onWinnerStateChange(value);
    }

    /**
     * Clean up resources when the manager is destroyed
     */
    public destroy(): void {
        if (this._frameId) {
            cancelAnimationFrame(this._frameId);
            this._frameId = undefined;
        }
    }

    /**
     * Handles mouse down or touch start events
     *
     * @param event - The mouse or touch event
     * @param interactionSource - The source of the interaction (mouse or touch)
     */
    public handlePointerDown(
        event: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent,
        interactionSource: InteractionSource
    ): void {
        // Prevent default to avoid scrolling while spinning the wheel
        event.preventDefault();

        const coordinates = getCoordinatesFromPointerEvent(event, interactionSource);

        if (!coordinates) {
            return;
        }

        this.willChange = true;
        this._quickClick = true;
        this.rotationBlur = 0;

        // Reset quick click flag after 500ms
        setTimeout(() => {
            this._quickClick = false;
        }, 500);

        this._pointerDown = true;
        this._rotationDifference = this._rotation - getPointerAngle(coordinates, this._wheelRef);
        this._pointerPos = coordinates;
        this._startPointerPos = coordinates;

        // Cancel any ongoing animation
        if (this._frameId) {
            cancelAnimationFrame(this._frameId);
            this._frameId = undefined;
        }

        this.hasWinner = false;
    }

    /**
     * Handles mouse move or touch move events
     *
     * @param event - The mouse or touch event
     * @param interactionSource - The source of the interaction (mouse or touch)
     */
    public handlePointerMove(
        event: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent,
        interactionSource: InteractionSource
    ): void {
        // Prevent default to avoid scrolling while spinning the wheel
        event.preventDefault();

        if (this._wheelManager === undefined) {
            return;
        }

        const coordinates = getCoordinatesFromPointerEvent(event, interactionSource);

        if (!coordinates) {
            return;
        }

        this._prevPointerPos = this._pointerPos;
        this._pointerPos = coordinates;

        if (!this._pointerDown) {
            return;
        }

        this.hasWinner = false;

        const pointerAngle = getPointerAngle(this._pointerPos, this._wheelRef);

        // Determine rotation direction based on pointer movement
        if (pointerAngle > this._prevPointerAngle || this._prevPointerAngle - pointerAngle > 180) {
            this._rotationDirection = RotationDirection.Clockwise;
        } else if (pointerAngle < this._prevPointerAngle || pointerAngle - this._prevPointerAngle > 180) {
            this._rotationDirection = RotationDirection.CounterClockwise;
        } else {
            this._rotationDirection = RotationDirection.None;
        }

        this._prevPointerAngle = pointerAngle;

        // Calculate rotation speed based on pointer movement
        const speed = Math.hypot(
            this._pointerPos.x - this._prevPointerPos.x,
            this._pointerPos.y - this._prevPointerPos.y
        );

        this._rotationSpeed = speed * 0.5;

        // Calculate and apply new rotation
        let newRotation: number = pointerAngle + this._rotationDifference;
        if (newRotation < 0) {
            newRotation += 360;
        } else if (newRotation >= 360) {
            newRotation -= 360;
        }

        this.rotation = newRotation;
    }

    /**
     * Handles mouse up or touch end events
     *
     * @param event - The mouse or touch event
     * @param interactionSource - The source of the interaction (mouse or touch)
     */
    public handlePointerUp(
        event: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent,
        interactionSource: InteractionSource
    ): void {
        if (this._wheelManager === undefined) {
            return;
        }

        const coordinates = getCoordinatesFromPointerEvent(event, interactionSource);

        if (!coordinates) {
            return;
        }

        if (this._pointerDown) {
            this._pointerDown = false;

            // Check if the wheel was dragged or just clicked
            if (coordinates.x !== this._startPointerPos.x || coordinates.y !== this._startPointerPos.y) {
                // Wheel was dragged, continue with momentum
                this._easing = Easing.Out;
                this._frameId = requestAnimationFrame(() => this.animate());
            } else if (this._quickClick) {
                // Quick click - spin the wheel with acceleration then deceleration
                this._easing = Easing.In;
                this._rotationSpeed = 0.8;
                this._rotationDirection = RotationDirection.CounterClockwise;
                this._frameId = requestAnimationFrame(() => this.animate());

                // Speed up after a delay
                setTimeout(() => {
                    this._rotationSpeed = 30 + Math.random() * 20;
                    this._rotationDirection = RotationDirection.Clockwise;

                    // Then start slowing down
                    setTimeout(() => {
                        this._easing = Easing.Out;
                    }, 400);
                }, 400);
            } else {
                // Neither drag nor quick click - reset animation state
                this.rotationBlur = 0;
                this.willChange = false;
                this._rotationSpeed = 0;

                if (this._frameId) {
                    cancelAnimationFrame(this._frameId);
                    this._frameId = undefined;
                }
            }
        }
    }

    /**
     * Animates the wheel with easing effects
     */
    private animate(): void {
        if (this._wheelManager === undefined) {
            return;
        }

        if (this._rotationSpeed > 0.02) {
            // Continue animation if wheel is still moving fast enough
            const currentRotation = this._rotation;
            let newRotation = currentRotation + this._rotationSpeed * this._rotationDirection;

            // Keep rotation within 0-360 degrees
            if (newRotation < 0) {
                newRotation += 360;
            } else if (newRotation >= 360) {
                newRotation -= 360;
            }

            this.rotation = newRotation;

            // Apply easing (speeding up or slowing down)
            this._rotationSpeed *= this._easing === Easing.In ? 1.01 : 0.99;

            // Calculate blur based on rotation speed
            this.rotationBlur =
                this._rotationSpeed <= MIN_SPEED
                    ? 0
                    : this._rotationSpeed >= MAX_SPEED
                      ? MAX_BLUR
                      : ((this._rotationSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * MAX_BLUR;

            // Continue animation in next frame
            this._frameId = requestAnimationFrame(() => this.animate());
        } else {
            // Animation finished - reset state
            this.rotationBlur = 0;
            this._frameId = undefined;
            this._rotationSpeed = 0;
            this.hasWinner = true;
            this.willChange = false;
        }
    }
}
