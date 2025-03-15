import { act, render, screen } from '@testing-library/react';
import { useLocation, useParams } from 'react-router';
import { AppNavBar } from '@/components/navbar';

vi.mock('react-router', () => ({
    useLocation: vi.fn(),
    useParams: vi.fn(),
}));

describe('AppNavBar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the navbar with links', () => {
        // @ts-expect-error Mocking a Location object
        vi.mocked(useLocation).mockReturnValue({ pathname: '/' });
        vi.mocked(useParams).mockReturnValue({ id: 'test-id' });

        render(<AppNavBar />);

        expect(screen.getByText('Wheel in the Sky')).toBeInTheDocument();
        expect(screen.getByText('Wheel')).toBeInTheDocument();
        expect(screen.getByText('Configure')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('sets the correct aria-current attribute for the active link', () => {
        // @ts-expect-error Mocking a Location object
        vi.mocked(useLocation).mockReturnValue({ pathname: '/wheel/v3/test-id' });
        vi.mocked(useParams).mockReturnValue({ id: 'test-id' });

        render(<AppNavBar />);

        expect(screen.getByText('Wheel')).toHaveAttribute('aria-current', 'page');
        expect(screen.getByText('Configure')).toHaveAttribute('aria-current', 'false');
        expect(screen.getByText('About')).toHaveAttribute('aria-current', 'false');
    });

    it('sets the correct href attribute for the links', () => {
        // @ts-expect-error Mocking a Location object
        vi.mocked(useLocation).mockReturnValue({ pathname: '/' });
        vi.mocked(useParams).mockReturnValue({ id: 'test-id' });

        render(<AppNavBar />);

        expect(screen.getByText('Wheel in the Sky').closest('a')).toHaveAttribute('href', '/');
        expect(screen.getByText('Wheel').closest('a')).toHaveAttribute('href', '/wheel/v3/test-id');
        expect(screen.getByText('Configure').closest('a')).toHaveAttribute('href', '/config/v3/test-id');
        expect(screen.getByText('About').closest('a')).toHaveAttribute('href', '/about');
    });

    it('renders the correct active state for the links', () => {
        // @ts-expect-error Mocking a Location object
        vi.mocked(useLocation).mockReturnValue({ pathname: '/config/v3/test-id' });
        vi.mocked(useParams).mockReturnValue({ id: 'test-id' });

        render(<AppNavBar />);

        expect(screen.getByText('Wheel')).toHaveAttribute('aria-current', 'false');
        expect(screen.getByText('Configure')).toHaveAttribute('aria-current', 'page');
        expect(screen.getByText('About')).toHaveAttribute('aria-current', 'false');

        expect(screen.getByText('Wheel').closest('li')).not.toHaveAttribute('data-active', 'true');
        expect(screen.getByText('Configure').closest('li')).toHaveAttribute('data-active', 'true');
        expect(screen.getByText('About').closest('li')).not.toHaveAttribute('data-active', 'true');
    });

    it('adjust the links when no config is present', () => {
        // @ts-expect-error Mocking a Location object
        vi.mocked(useLocation).mockReturnValue({ pathname: '/config/v3/new' });
        vi.mocked(useParams).mockReturnValue({ id: 'new' });

        render(<AppNavBar />);

        expect(screen.queryByText('Wheel')).not.toBeInTheDocument();
        expect(screen.getByText('Create Wheel')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('closes the menu when a link is clicked', () => {
        // @ts-expect-error Mocking a Location object
        vi.mocked(useLocation).mockReturnValue({ pathname: '/' });
        vi.mocked(useParams).mockReturnValue({ id: 'test-id' });

        render(<AppNavBar />);

        const menuButton = screen.getByRole('button', { name: 'Open Menu' });

        expect(menuButton.dataset.open).toBeUndefined();

        act(() => {
            menuButton.click();
        });
        expect(menuButton.dataset.open).toBe('true');

        act(() => {
            menuButton.click();
        });
        expect(menuButton.dataset.open).toBeUndefined();
    });
});
