import { Config } from '@repo/shared/classes/config';
import { PageColorType } from '@repo/shared/enums/page-colors';
import { WheelColorType } from '@repo/shared/enums/wheel-colors';
import { render, screen } from '@testing-library/react';
import * as colorHooks from '@/hooks/colors';
import { WheelPreview } from '../wheel-preview';

vi.mock('@/hooks/colors');

describe('WheelPreview Component', () => {
    const wheelNames = ['Item 1', 'Item 2', 'Item 3'];

    const defaultProps = {
        title: 'Test Wheel',
        description: 'Test Description',
        names: wheelNames.join('\n'),
        randomizeOrder: false,
        wheelColorType: WheelColorType.Random,
        pageColorType: PageColorType.Single,
        backgroundColor: '#ffffff',
        foregroundColor: '#000000',
        showNames: true,
    };

    beforeEach(() => {
        vi.mocked(colorHooks.useBgColor).mockReturnValue('#ffffff');
        vi.mocked(colorHooks.useFgColor).mockReturnValue('#000000');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state when no names provided', () => {
        render(<WheelPreview {...defaultProps} names="" />);

        expect(screen.getByText('Add at Least 1 Wheel Segment')).toBeInTheDocument();
    });

    it('renders wheel when names are provided', () => {
        render(<WheelPreview {...defaultProps} />);

        expect(screen.getByText('Test Wheel')).toBeInTheDocument();
        expect(screen.queryByText('Add at Least 1 Wheel Segment')).not.toBeInTheDocument();
    });

    it('renders correct number of wheel segments', () => {
        render(<WheelPreview {...defaultProps} />);

        const segments = screen.getAllByTestId('wheel-segment');
        expect(segments).toHaveLength(wheelNames.length);
        for (const [i, wheelName] of wheelNames.entries()) {
            expect(segments[i]).toHaveTextContent(wheelName);
        }
    });

    it('applies custom height when provided', () => {
        const customHeight = '600px';
        const { container } = render(<WheelPreview {...defaultProps} height={customHeight} />);

        const card = container.querySelector('.w-full');
        expect(card).toHaveStyle({ height: customHeight });
    });

    it('uses color hooks with correct parameters', () => {
        render(<WheelPreview {...defaultProps} />);

        expect(colorHooks.useBgColor).toHaveBeenCalledWith(expect.any(Config), defaultProps.backgroundColor);
        // TODO: Uncomment this line when useFgColor is implemented
        // expect(colorHooks.useFgColor).toHaveBeenCalledWith(expect.any(Config), defaultProps.foregroundColor);
    });
});
