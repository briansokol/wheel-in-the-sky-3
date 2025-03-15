import { WheelManager } from '@repo/shared/classes/wheel-manager';
import { act, fireEvent, render } from '@testing-library/react';
import { vi } from 'vitest';
import { Wheel } from '@/components/wheel';
import { RotationProvider } from '@/contexts/rotation-provider';
import { SegmentProvider } from '@/contexts/segment-provider';

describe('Wheel', () => {
    const mockSetRotation = vi.fn();
    const mockWheelManager = {
        setRotation: mockSetRotation,
        segments: [
            {
                id: '1',
                name: 'Segment 1',
                backgroundColor: '#FF0000',
                textColor: '#FFFFFF',
                degrees: 180,
                index: 0,
            },
            {
                id: '2',
                name: 'Segment 2',
                backgroundColor: '#00FF00',
                textColor: '#000000',
                degrees: 180,
                index: 1,
            },
        ],
    } as unknown as WheelManager;

    beforeEach(() => {
        vi.useFakeTimers();
        mockSetRotation.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders with correct initial properties', () => {
        const { container } = render(
            <RotationProvider>
                <SegmentProvider>
                    <Wheel wheelManager={mockWheelManager} radius="400px" />
                </SegmentProvider>
            </RotationProvider>
        );

        const wheelElement = container.firstChild as HTMLElement;
        expect(wheelElement).toHaveStyle({
            width: '400px',
            transform: 'rotate(0deg)',
        });
    });

    it('renders segments correctly', () => {
        const { getAllByText } = render(
            <RotationProvider>
                <SegmentProvider>
                    <Wheel wheelManager={mockWheelManager} radius="400px" />
                </SegmentProvider>
            </RotationProvider>
        );

        expect(getAllByText(/Segment [12]/)).toHaveLength(2);
    });

    it('handles mouse down event', () => {
        const { container } = render(
            <RotationProvider>
                <SegmentProvider>
                    <Wheel wheelManager={mockWheelManager} radius="400px" />
                </SegmentProvider>
            </RotationProvider>
        );

        fireEvent.mouseDown(container.firstChild as HTMLElement, {
            clientX: 200,
            clientY: 200,
        });

        expect(mockSetRotation).not.toHaveBeenCalled();
    });

    it('handles mouse move event when mouse is down', () => {
        const { container } = render(
            <RotationProvider>
                <SegmentProvider>
                    <Wheel wheelManager={mockWheelManager} radius="400px" />
                </SegmentProvider>
            </RotationProvider>
        );

        fireEvent.mouseDown(container.firstChild as HTMLElement, {
            clientX: 200,
            clientY: 200,
        });

        fireEvent.mouseMove(document, {
            clientX: 220,
            clientY: 220,
        });

        expect(mockSetRotation).toHaveBeenCalled();
    });

    it('stops rotation animation on mouse down if wheel is spinning', () => {
        const { container } = render(
            <RotationProvider>
                <SegmentProvider>
                    <Wheel wheelManager={mockWheelManager} radius="400px" />
                </SegmentProvider>
            </RotationProvider>
        );

        const cancelAnimationFrameSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

        fireEvent.mouseDown(container.firstChild as HTMLElement, {
            clientX: 200,
            clientY: 200,
        });

        fireEvent.mouseMove(document, {
            clientX: 220,
            clientY: 220,
        });

        fireEvent.mouseUp(document);

        fireEvent.mouseDown(container.firstChild as HTMLElement, {
            clientX: 200,
            clientY: 200,
        });

        expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });

    it('does not stop rotation animation on mouse down if wheel is not spinning', () => {
        const { container } = render(
            <RotationProvider>
                <SegmentProvider>
                    <Wheel wheelManager={mockWheelManager} radius="400px" />
                </SegmentProvider>
            </RotationProvider>
        );

        const cancelAnimationFrameSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

        fireEvent.mouseDown(container.firstChild as HTMLElement, {
            clientX: 200,
            clientY: 200,
        });

        expect(cancelAnimationFrameSpy).not.toHaveBeenCalled();
    });

    it('does not attach event listeners when isStatic is true', () => {
        const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener');

        render(
            <RotationProvider>
                <SegmentProvider>
                    <Wheel wheelManager={mockWheelManager} radius="400px" isStatic={true} />
                </SegmentProvider>
            </RotationProvider>
        );

        expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('cleans up event listeners on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener');

        const { unmount } = render(
            <RotationProvider>
                <SegmentProvider>
                    <Wheel wheelManager={mockWheelManager} radius="400px" />
                </SegmentProvider>
            </RotationProvider>
        );

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledTimes(2); // mousedown, mousemove, mouseup
    });

    it('handles animation frame updates', () => {
        const { container } = render(
            <RotationProvider>
                <SegmentProvider>
                    <Wheel wheelManager={mockWheelManager} radius="400px" />
                </SegmentProvider>
            </RotationProvider>
        );

        fireEvent.mouseDown(container.firstChild as HTMLElement, {
            clientX: 200,
            clientY: 200,
        });

        fireEvent.mouseMove(document, {
            clientX: 220,
            clientY: 220,
        });

        fireEvent.mouseUp(document);

        act(() => {
            vi.runAllTimers();
        });

        expect(mockSetRotation).toHaveBeenCalled();
    });

    it('matches snapshot', () => {
        const { container } = render(
            <RotationProvider>
                <SegmentProvider>
                    <Wheel wheelManager={mockWheelManager} radius="400px" />
                </SegmentProvider>
            </RotationProvider>
        );
        expect(container.firstChild).toMatchSnapshot();
    });
});
