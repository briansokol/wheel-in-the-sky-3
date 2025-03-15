import { TinyColor } from '@ctrl/tinycolor';
import { Segment } from '@repo/shared/classes/segment';
import { render, screen } from '@testing-library/react';
import { WheelSegment } from '@/components/wheel-segment';

describe('WheelSegment', () => {
    let mockSegment: Segment;
    beforeEach(() => {
        mockSegment = new Segment(0, 'Test Segment', 90, 0, 90, new TinyColor('#FF0000'));
    });

    it('should render segment with correct name', () => {
        render(<WheelSegment segment={mockSegment} />);
        expect(screen.getByText('Test Segment')).toBeInTheDocument();
    });

    it('should apply correct base styles', () => {
        const { container } = render(<WheelSegment segment={mockSegment} />);
        const segmentDiv = container.firstChild as HTMLElement;

        expect(segmentDiv).toHaveStyle({
            backgroundColor: '#ff0000',
            transform: 'rotate(-90deg) rotate(45deg) rotate(0deg)',
            transformOrigin: '50% 50%',
        });
    });

    it('should not apply clip path when it is the only segment', () => {
        mockSegment = new Segment(0, 'Test Segment', 360, 0, 90, new TinyColor('#FF0000'));

        const { container } = render(<WheelSegment segment={mockSegment} />);
        const segmentDiv = container.firstChild as HTMLElement;

        expect(segmentDiv).toHaveStyle({clipPath:''});
    });

    it('should apply proper clip path when there are only 2 segments', () => {
        mockSegment = new Segment(0, 'Test Segment', 180, 0, 90, new TinyColor('#FF0000'));

        const { container } = render(<WheelSegment segment={mockSegment} />);
        const segmentDiv = container.firstChild as HTMLElement;

        expect(segmentDiv.style.clipPath).toContain('polygon(100% 0');
    });

    it('should apply proper clip path when there are more than 3 segments', () => {
        const { container } = render(<WheelSegment segment={mockSegment} />);
        const segmentDiv = container.firstChild as HTMLElement;

        expect(segmentDiv.style.clipPath).toContain('polygon(50% 50%');
    });

    it('should render text with correct styling', () => {
        const { container } = render(<WheelSegment segment={mockSegment} />);
        const textDiv = container.querySelector('.absolute.right-5') as HTMLElement;

        expect(textDiv).toHaveStyle({
            color: mockSegment.textColor,
            transformOrigin: 'right center',
            transform: 'translateY(-50%)',
        });
    });

    it('should handle different segment indices', () => {
        const mockSegment2 = new Segment(2, 'Test Segment 2', 90, 180, 270, new TinyColor('#00FF00'));

        const { container } = render(<WheelSegment segment={mockSegment2} />);
        const segmentDiv = container.firstChild as HTMLElement;

        expect(segmentDiv).toHaveStyle({
            transform: 'rotate(-90deg) rotate(45deg) rotate(180deg)',
        });
    });

    it('should handle different segment sizes', () => {
        const mockSegment3 = new Segment(0, 'Test Segment 3', 60, 0, 60, new TinyColor('#0000FF'));

        const { container } = render(<WheelSegment segment={mockSegment3} />);
        const segmentDiv = container.firstChild as HTMLElement;

        expect(segmentDiv).toHaveStyle({
            transform: 'rotate(-90deg) rotate(30deg) rotate(0deg)',
        });
    });

    it('matches snapshots', () => {
        // 1 segment
        const mockSegment1 = new Segment(0, 'Test Segment 1', 360, 0, 0, new TinyColor('#0000FF'));
        const { container: container1 } = render(<WheelSegment segment={mockSegment1} />);
        expect(container1.firstChild).toMatchSnapshot();

        // 2 segments
        const mockSegment2 = new Segment(0, 'Test Segment 2', 360 / 2, 0, 0, new TinyColor('#0000FF'));
        const { container: container2 } = render(<WheelSegment segment={mockSegment2} />);
        expect(container2.firstChild).toMatchSnapshot();

        // 3 segments
        const mockSegment3 = new Segment(0, 'Test Segment 3', 360 / 3, 0, 0, new TinyColor('#0000FF'));
        const { container: container3 } = render(<WheelSegment segment={mockSegment3} />);
        expect(container3.firstChild).toMatchSnapshot();

        // 4 segments
        const mockSegment4 = new Segment(0, 'Test Segment 4', 360 / 4, 0, 0, new TinyColor('#0000FF'));
        const { container: container4 } = render(<WheelSegment segment={mockSegment4} />);
        expect(container4.firstChild).toMatchSnapshot();

        // 5 segments
        const mockSegment5 = new Segment(0, 'Test Segment 5', 360 / 5, 0, 0, new TinyColor('#0000FF'));
        const { container: container5 } = render(<WheelSegment segment={mockSegment5} />);
        expect(container5.firstChild).toMatchSnapshot();
    });
});
