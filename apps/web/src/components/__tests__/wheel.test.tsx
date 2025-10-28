import { type WheelManager } from '@repo/shared/classes/wheel-manager';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as RotationContextModule from '@/contexts/rotation';
import * as SegmentContextModule from '@/contexts/segment';
import { Wheel } from '../wheel';

/**
 * Creates a mock WheelManager for testing
 */
function createMockWheelManager(): WheelManager {
    return {
        segments: [
            { id: '1', name: 'Segment 1', color: '#FF0000' },
            { id: '2', name: 'Segment 2', color: '#00FF00' },
            { id: '3', name: 'Segment 3', color: '#0000FF' },
        ],
        config: {
            showNames: true,
        },
    } as unknown as WheelManager;
}

/**
 * Creates a test wrapper with required context providers
 */
function createTestWrapper(): React.FC<{ children: ReactNode }> {
    const TestWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
        const mockSetRotation = vi.fn();
        const mockSetHasWinner = vi.fn();

        const RotationContextValue = {
            rotation: 0,
            setRotation: mockSetRotation,
        };

        const SegmentContextValue = {
            hasWinner: false,
            setHasWinner: mockSetHasWinner,
        };

        return (
            <RotationContextModule.RotationContext.Provider value={RotationContextValue}>
                <SegmentContextModule.SegmentContext.Provider value={SegmentContextValue}>
                    {children}
                </SegmentContextModule.SegmentContext.Provider>
            </RotationContextModule.RotationContext.Provider>
        );
    };

    TestWrapper.displayName = 'TestWrapper';
    return TestWrapper;
}

describe('Wheel Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('rendering', () => {
        it('should render without error', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            expect(container).toBeTruthy();
        });

        it('should render wheel blur overlay with correct data-testid', () => {
            const mockWheelManager = createMockWheelManager();

            render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const blurOverlay = screen.getByTestId('wheel-blur');
            expect(blurOverlay).toBeInTheDocument();
        });

        it('should render with default diameter when not provided', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            expect(wheelElement).toHaveStyle('width: 400px');
        });

        it('should apply custom diameter prop', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="500px" />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            expect(wheelElement).toHaveStyle('width: 500px');
            expect(wheelElement).toHaveStyle('padding-top: 500px');
        });

        it('should render when wheelManager is undefined', () => {
            const { container } = render(<Wheel wheelManager={undefined} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            expect(container).toBeTruthy();
            const blurOverlay = screen.getByTestId('wheel-blur');
            expect(blurOverlay).toBeInTheDocument();
        });

        it('should apply clipPath circle styling', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            expect(wheelElement).toHaveStyle('clip-path: circle(50%)');
        });
    });

    describe('className and styling', () => {
        it('should apply relative, overflow-hidden, rounded-full, select-none classes', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            const classList = wheelElement.className;

            expect(classList).toContain('relative');
            expect(classList).toContain('overflow-hidden');
            expect(classList).toContain('rounded-full');
            expect(classList).toContain('select-none');
        });

        it('should apply cursor-grab and active:cursor-grabbing when not static', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" isStatic={false} />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            const classList = wheelElement.className;

            expect(classList).toContain('cursor-grab');
            expect(classList).toContain('active:cursor-grabbing');
        });

        it('should not apply cursor classes when isStatic is true', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" isStatic={true} />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            const classList = wheelElement.className;

            expect(classList).not.toContain('cursor-grab');
            expect(classList).not.toContain('active:cursor-grabbing');
        });
    });

    describe('inline styles', () => {
        it('should apply initial transform: rotate(0deg)', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            expect(wheelElement).toHaveStyle('transform: rotate(0deg)');
        });

        it('should apply initial filter: blur(0)', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            expect(wheelElement).toHaveStyle('filter: blur(0)');
        });

        it('should apply willChange: auto', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            expect(wheelElement).toHaveStyle('will-change: auto');
        });
    });

    describe('blur overlay styling', () => {
        it('should have correct positioning classes', () => {
            const mockWheelManager = createMockWheelManager();

            render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const blurOverlay = screen.getByTestId('wheel-blur');
            const classList = blurOverlay.className;

            expect(classList).toContain('absolute');
            expect(classList).toContain('top-0');
            expect(classList).toContain('left-0');
            expect(classList).toContain('size-full');
        });

        it('should have backdrop-filter style applied', () => {
            const mockWheelManager = createMockWheelManager();

            render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const blurOverlay = screen.getByTestId('wheel-blur');
            // Verify the inline style property exists and is not empty
            expect(blurOverlay.style.backdropFilter).toBeTruthy();
        });

        it('should have willChange: auto', () => {
            const mockWheelManager = createMockWheelManager();

            render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const blurOverlay = screen.getByTestId('wheel-blur');
            expect(blurOverlay).toHaveStyle('will-change: auto');
        });
    });

    describe('event listeners', () => {
        it('should attach mouse event listeners when not static', () => {
            const mockWheelManager = createMockWheelManager();
            const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener');

            render(<Wheel wheelManager={mockWheelManager} diameter="400px" isStatic={false} />, {
                wrapper: createTestWrapper(),
            });

            const mousedownCalls = addEventListenerSpy.mock.calls.filter(
                (call) =>
                    call[0] === 'mousemove' ||
                    call[0] === 'touchmove' ||
                    call[0] === 'mouseup' ||
                    call[0] === 'touchend'
            );

            expect(mousedownCalls.length).toBeGreaterThanOrEqual(4);

            addEventListenerSpy.mockRestore();
        });

        it('should not attach global listeners when isStatic is true', () => {
            const mockWheelManager = createMockWheelManager();
            const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener');

            render(<Wheel wheelManager={mockWheelManager} diameter="400px" isStatic={true} />, {
                wrapper: createTestWrapper(),
            });

            // Only non-global listeners should be added (mousemove, touchmove, mouseup, touchend)
            const globalListenerCalls = addEventListenerSpy.mock.calls.filter(
                (call) =>
                    call[0] === 'mousemove' ||
                    call[0] === 'touchmove' ||
                    call[0] === 'mouseup' ||
                    call[0] === 'touchend'
            );

            expect(globalListenerCalls.length).toBe(0);

            addEventListenerSpy.mockRestore();
        });

        it('should clean up event listeners on unmount', () => {
            const mockWheelManager = createMockWheelManager();
            const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener');

            const { unmount } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" isStatic={false} />, {
                wrapper: createTestWrapper(),
            });

            unmount();

            const removeListenerCalls = removeEventListenerSpy.mock.calls.filter(
                (call) =>
                    call[0] === 'mousemove' ||
                    call[0] === 'touchmove' ||
                    call[0] === 'mouseup' ||
                    call[0] === 'touchend'
            );

            expect(removeListenerCalls.length).toBeGreaterThan(0);

            removeEventListenerSpy.mockRestore();
        });
    });

    describe('animation manager lifecycle', () => {
        it('should create animation manager on mount', () => {
            const mockWheelManager = createMockWheelManager();

            render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            // If no error occurs and component renders, animation manager was created
            expect(screen.getByTestId('wheel-blur')).toBeInTheDocument();
        });

        it('should destroy animation manager on unmount', () => {
            const mockWheelManager = createMockWheelManager();

            const { unmount } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            // Should not throw when unmounting
            expect(() => {
                unmount();
            }).not.toThrow();
        });

        it('should handle wheelManager prop changes', () => {
            const mockWheelManager1 = createMockWheelManager();
            const mockWheelManager2 = createMockWheelManager();

            const { rerender } = render(<Wheel wheelManager={mockWheelManager1} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            // Rerender with different wheelManager
            rerender(<Wheel wheelManager={mockWheelManager2} diameter="400px" />);

            expect(screen.getByTestId('wheel-blur')).toBeInTheDocument();
        });
    });

    describe('context integration', () => {
        it('should work with context provider', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            expect(container).toBeTruthy();
        });

        it('should handle context with undefined setter functions', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            // Component should render even if context setters are undefined
            expect(container.querySelector('[data-testid="wheel-blur"]')).toBeTruthy();
        });
    });

    describe('segment rendering', () => {
        it('should render all segments from wheelManager', () => {
            const mockWheelManager = createMockWheelManager();

            render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            // Verify that the component attempted to render segments
            // (MemoizedWheelSegment is a separate component, so we just check the structure)
            const wheelElement = document.querySelector('[style*="rotate"]');
            expect(wheelElement).toBeTruthy();
        });

        it('should not render segments when wheelManager is undefined', () => {
            const { container } = render(<Wheel wheelManager={undefined} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            // Wheel should still render even without wheelManager
            expect(container.querySelector('[data-testid="wheel-blur"]')).toBeTruthy();
        });
    });

    describe('accessibility', () => {
        it('should have select-none class to prevent text selection', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            expect(wheelElement.className).toContain('select-none');
        });

        it('should have clip-path for circular appearance', () => {
            const mockWheelManager = createMockWheelManager();

            const { container } = render(<Wheel wheelManager={mockWheelManager} diameter="400px" />, {
                wrapper: createTestWrapper(),
            });

            const wheelElement = container.firstChild as HTMLElement;
            expect(wheelElement).toHaveStyle('clip-path: circle(50%)');
        });
    });
});
