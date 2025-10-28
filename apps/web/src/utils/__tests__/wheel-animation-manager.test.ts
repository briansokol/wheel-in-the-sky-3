import { type WheelManager } from '@repo/shared/classes/wheel-manager';
import { InteractionSource } from '@repo/shared/types/wheel';
import { type RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AnimationStateCallbacks, WheelAnimationManager } from '../wheel-animation-manager';

// Mock the wheel-animation utilities
vi.mock('../wheel-animation', () => ({
    getCoordinatesFromPointerEvent: vi.fn((event) => {
        if (event instanceof MouseEvent) {
            return { x: event.clientX, y: event.clientY };
        }
        if (event instanceof TouchEvent) {
            const touch = event.touches[0];
            return { x: touch.clientX, y: touch.clientY };
        }
        return { x: 0, y: 0 };
    }),
    getPointerAngle: vi.fn(() => 45),
}));

/**
 * Creates a mock WheelManager for testing
 */
function createMockWheelManager(): WheelManager {
    return {
        segments: [
            { id: '1', name: 'Segment 1', color: '#FF0000' },
            { id: '2', name: 'Segment 2', color: '#00FF00' },
        ],
        config: {
            showNames: true,
        },
    } as unknown as WheelManager;
}

/**
 * Creates mock refs for the wheel DOM elements
 */
function createMockRefs(): {
    wheelRef: RefObject<HTMLDivElement>;
    wheelBlurRef: RefObject<HTMLDivElement>;
} {
    return {
        wheelRef: { current: document.createElement('div') } as RefObject<HTMLDivElement>,
        wheelBlurRef: { current: document.createElement('div') } as RefObject<HTMLDivElement>,
    };
}

describe('WheelAnimationManager', () => {
    let mockCallbacks: AnimationStateCallbacks;
    let mockWheelManager: WheelManager;
    let wheelRef: RefObject<HTMLDivElement>;
    let wheelBlurRef: RefObject<HTMLDivElement>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        mockCallbacks = {
            onWinnerStateChange: vi.fn(),
        };

        mockWheelManager = createMockWheelManager();
        const refs = createMockRefs();
        wheelRef = refs.wheelRef;
        wheelBlurRef = refs.wheelBlurRef;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
    });

    describe('initialization', () => {
        it('should create instance with provided managers and refs', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            expect(manager.rotation).toBe(0);
            expect(manager.rotationBlur).toBe(0);
            expect(manager.hasWinner).toBe(false);
            expect(manager.willChange).toBe(false);
        });

        it('should handle undefined wheelManager gracefully', () => {
            const manager = new WheelAnimationManager(undefined, wheelRef, wheelBlurRef, mockCallbacks);

            expect(manager.rotation).toBe(0);
            expect(mockCallbacks.onWinnerStateChange).not.toHaveBeenCalled();
        });

        it('should handle null refs gracefully', () => {
            const nullWheelRef = { current: null } as unknown as RefObject<HTMLDivElement>;
            const nullBlurRef = { current: null } as unknown as RefObject<HTMLDivElement>;

            const manager = new WheelAnimationManager(mockWheelManager, nullWheelRef, nullBlurRef, mockCallbacks);

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (manager as any)._rotation = 90;
            }).not.toThrow();
        });
    });

    describe('rotation property', () => {
        it('should get rotation value', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            expect(manager.rotation).toBe(0);
        });

        it('should update DOM element transform when rotation changes internally', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any).rotation = 45;

            expect(wheelRef.current?.style.transform).toBe('rotate(45deg)');
        });

        it('should handle negative rotation values', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any).rotation = -45;

            expect(wheelRef.current?.style.transform).toBe('rotate(-45deg)');
        });
    });

    describe('rotationBlur property', () => {
        it('should get rotationBlur value', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            expect(manager.rotationBlur).toBe(0);
        });

        it('should update DOM element backdropFilter when rotationBlur changes', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any).rotationBlur = 5;

            expect(wheelBlurRef.current?.style.backdropFilter).toBe('blur(5px)');
        });

        it('should initialize rotationBlur to 0', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            expect(manager.rotationBlur).toBe(0);
        });
    });

    describe('willChange property', () => {
        it('should update willChange CSS optimization flag', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any).willChange = true;

            expect(wheelRef.current?.style.willChange).toBe('transform');
            expect(wheelBlurRef.current?.style.willChange).toBe('backdrop-filter');
        });

        it('should reset willChange to auto when set to false', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any).willChange = true;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any).willChange = false;

            expect(wheelRef.current?.style.willChange).toBe('auto');
            expect(wheelBlurRef.current?.style.willChange).toBe('auto');
        });
    });

    describe('hasWinner property', () => {
        it('should update hasWinner state and call callback', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any).hasWinner = true;

            expect(manager.hasWinner).toBe(true);
            expect(mockCallbacks.onWinnerStateChange).toHaveBeenCalledWith(true, 0);
        });

        it('should pass current rotation to callback', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any)._rotation = 123;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any).hasWinner = true;

            expect(mockCallbacks.onWinnerStateChange).toHaveBeenCalledWith(true, 123);
        });
    });

    describe('handlePointerDown', () => {
        it('should set pointer down flag and prevent default', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            const event = new MouseEvent('mousedown');
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

            manager.handlePointerDown(event, InteractionSource.Mouse);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should set willChange to true', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            const event = new MouseEvent('mousedown');
            manager.handlePointerDown(event, InteractionSource.Mouse);

            expect(manager.willChange).toBe(true);
        });

        it('should set rotationBlur to 0 on pointer down', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            const event = new MouseEvent('mousedown');
            manager.handlePointerDown(event, InteractionSource.Mouse);

            expect(manager.rotationBlur).toBe(0);
        });

        it('should set hasWinner to false', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any)._hasWinner = true;
            const event = new MouseEvent('mousedown');
            manager.handlePointerDown(event, InteractionSource.Mouse);

            expect(manager.hasWinner).toBe(false);
        });

        it('should reset quickClick flag after 500ms', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            const event = new MouseEvent('mousedown');
            manager.handlePointerDown(event, InteractionSource.Mouse);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((manager as any)._quickClick).toBe(true);

            vi.advanceTimersByTime(500);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((manager as any)._quickClick).toBe(false);
        });

        it('should cancel ongoing animation frame', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any)._frameId = 123;

            const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');

            const event = new MouseEvent('mousedown');
            manager.handlePointerDown(event, InteractionSource.Mouse);

            expect(cancelSpy).toHaveBeenCalledWith(123);
        });
    });

    describe('handlePointerMove', () => {
        it('should return early if wheelManager is undefined', () => {
            const manager = new WheelAnimationManager(undefined, wheelRef, wheelBlurRef, mockCallbacks);

            const event = new MouseEvent('mousemove');
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

            manager.handlePointerMove(event, InteractionSource.Mouse);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should prevent default behavior', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            const event = new MouseEvent('mousemove');
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

            manager.handlePointerMove(event, InteractionSource.Mouse);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should reset hasWinner on move when pointer is down', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any)._pointerDown = true;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any)._hasWinner = true;
            const event = new MouseEvent('mousemove');
            manager.handlePointerMove(event, InteractionSource.Mouse);

            expect(mockCallbacks.onWinnerStateChange).toHaveBeenCalledWith(false, expect.any(Number));
        });

        it('should handle undefined coordinates gracefully', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            const event = new MouseEvent('mousemove', { clientX: 0, clientY: 0 });

            expect(() => {
                manager.handlePointerMove(event, InteractionSource.Mouse);
            }).not.toThrow();
        });
    });

    describe('handlePointerUp', () => {
        it('should return early if wheelManager is undefined', () => {
            const manager = new WheelAnimationManager(undefined, wheelRef, wheelBlurRef, mockCallbacks);

            const event = new MouseEvent('mouseup');

            expect(() => {
                manager.handlePointerUp(event, InteractionSource.Mouse);
            }).not.toThrow();
        });

        it('should set pointerDown to false', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any)._pointerDown = true;
            const downEvent = new MouseEvent('mousedown');
            manager.handlePointerDown(downEvent, InteractionSource.Mouse);

            const upEvent = new MouseEvent('mouseup');
            manager.handlePointerUp(upEvent, InteractionSource.Mouse);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((manager as any)._pointerDown).toBe(false);
        });

        it('should handle case where pointerDown is false', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            const event = new MouseEvent('mouseup');

            expect(() => {
                manager.handlePointerUp(event, InteractionSource.Mouse);
            }).not.toThrow();
        });

        it('should reset animation state for non-drag, non-click scenario', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // First pointer down
            const downEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
            manager.handlePointerDown(downEvent, InteractionSource.Mouse);

            // Advance past quickClick timeout
            vi.advanceTimersByTime(501);

            // Then pointer up at same location
            const upEvent = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });
            manager.handlePointerUp(upEvent, InteractionSource.Mouse);

            expect(manager.rotationBlur).toBe(0);
            expect(manager.willChange).toBe(false);
        });
    });

    describe('destroy', () => {
        it('should cancel animation frame on destroy', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any)._frameId = 123;
            const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');

            manager.destroy();

            expect(cancelSpy).toHaveBeenCalledWith(123);
        });

        it('should be safe to call multiple times', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            expect(() => {
                manager.destroy();
                manager.destroy();
            }).not.toThrow();
        });

        it('should clear frameId after destroy', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any)._frameId = 123;
            manager.destroy();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((manager as any)._frameId).toBeUndefined();
        });
    });

    describe('getter properties', () => {
        it('should get rotation value', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            expect(typeof manager.rotation).toBe('number');
            expect(manager.rotation).toBe(0);
        });

        it('should get rotationBlur value', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            expect(typeof manager.rotationBlur).toBe('number');
        });

        it('should get willChange value', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            expect(typeof manager.willChange).toBe('boolean');
            expect(manager.willChange).toBe(false);
        });

        it('should get hasWinner value', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            expect(typeof manager.hasWinner).toBe('boolean');
            expect(manager.hasWinner).toBe(false);
        });
    });

    describe('animation behavior', () => {
        it('should keep blur at 0 during animation', () => {
            const manager = new WheelAnimationManager(mockWheelManager, wheelRef, wheelBlurRef, mockCallbacks);

            const event = new MouseEvent('mousedown');
            manager.handlePointerDown(event, InteractionSource.Mouse);

            // Set up rotation speed to trigger animation
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any)._rotationSpeed = 5;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (manager as any)._rotationDirection = 1;

            // Call animate indirectly through requestAnimationFrame
            vi.advanceTimersByTime(16); // One frame

            // Blur should remain 0 due to commented-out blur calculation
            expect(manager.rotationBlur).toBe(0);
        });
    });
});
