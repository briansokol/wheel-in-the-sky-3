import { RouterProvider } from '@heroui/react';
import { Config } from '@repo/shared/classes/config';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useHref, useNavigate } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from '@/contexts/config-provider';
import { RemovedWinnersProvider } from '@/contexts/removed-winners-provider';
import { SegmentProvider } from '@/contexts/segment-provider';
import { AppNavBar } from '../navbar';

vi.mock('@/hooks/config', () => {
    const config = new Config();
    config.setNamesArray(['Alice', 'Bob']);
    return {
        useDecodedConfig: () => ({ data: config, isError: false, isPending: false }),
    };
});

function RouterBridge({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    return (
        <RouterProvider navigate={navigate} useHref={useHref}>
            {children}
        </RouterProvider>
    );
}

function TestNavigate({ to }: { to: string }) {
    const navigate = useNavigate();
    return (
        <button type="button" onClick={() => void navigate(to)}>
            Test navigate
        </button>
    );
}

function renderNavbar(initialEntry: string) {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <ConfigProvider>
                <SegmentProvider>
                    <RemovedWinnersProvider>
                        <RouterBridge>
                            <AppNavBar />
                            <TestNavigate to="/about" />
                            <Routes>
                                <Route path="/about" element={<p>About placeholder</p>} />
                                <Route path="/wheel" element={<p>Wheel placeholder</p>} />
                                <Route path="*" element={<p>Other placeholder</p>} />
                            </Routes>
                        </RouterBridge>
                    </RemovedWinnersProvider>
                </SegmentProvider>
            </ConfigProvider>
        </MemoryRouter>
    );
}

describe('AppNavBar', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        document.body.style.overflow = '';
    });

    it('shows the Wheel link only when a config is in the URL', () => {
        const { unmount } = renderNavbar('/config');
        expect(screen.queryByRole('link', { name: 'Wheel' })).not.toBeInTheDocument();
        unmount();

        renderNavbar('/config?c=abc');
        expect(screen.getByRole('link', { name: 'Wheel' })).toBeInTheDocument();
    });

    it('marks the current page with aria-current', () => {
        renderNavbar('/about');
        expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    });

    it('clicking About navigates without a page load', () => {
        renderNavbar('/config');
        fireEvent.click(screen.getByRole('link', { name: 'About' }));
        expect(screen.getByText('About placeholder')).toBeInTheDocument();
    });

    it('toggle opens and closes the mobile menu', () => {
        renderNavbar('/config');
        const toggle = screen.getByRole('button', { name: 'Open Menu' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getAllByRole('link', { name: 'About' })).toHaveLength(1);

        fireEvent.click(toggle);
        const closeToggle = screen.getByRole('button', { name: 'Close Menu' });
        expect(closeToggle).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getAllByRole('link', { name: 'About' })).toHaveLength(2);

        fireEvent.click(closeToggle);
        expect(screen.getByRole('button', { name: 'Open Menu' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('restores body scroll when the menu closes and on unmount', () => {
        const { unmount } = renderNavbar('/config');
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        expect(document.body.style.overflow).toBe('hidden');

        fireEvent.click(screen.getByRole('button', { name: 'Close Menu' }));
        expect(document.body.style.overflow).toBe('');

        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('preserves a pre-existing body scroll lock when the menu closes and on unmount', () => {
        document.body.style.overflow = 'hidden';
        const { unmount } = renderNavbar('/wheel?c=abc');
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        expect(document.body.style.overflow).toBe('hidden');

        fireEvent.click(screen.getByRole('button', { name: 'Close Menu' }));
        expect(document.body.style.overflow).toBe('hidden');

        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        unmount();
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('renders the mobile panel outside the backdrop-blur header', () => {
        renderNavbar('/config');
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        const header = screen.getByRole('banner');
        const panel = screen.getAllByRole('link', { name: 'About' })[1].closest('.fixed');
        expect(panel).not.toBeNull();
        expect(header.contains(panel)).toBe(false);
    });

    it('header and mobile panel are glass surfaces', () => {
        renderNavbar('/config');
        const header = screen.getByRole('banner');
        expect(header).toHaveClass('glass-surface');
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        const panel = screen.getAllByRole('link', { name: 'About' })[1].closest('.fixed');
        expect(panel).toHaveClass('glass-surface');
        expect(header.contains(panel)).toBe(false);
    });

    it('header and mobile panel use the strong glass tint', () => {
        renderNavbar('/config');
        expect(screen.getByRole('banner')).toHaveClass('glass-tint-strong');
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        const panel = screen.getAllByRole('link', { name: 'About' })[1].closest('.fixed');
        expect(panel).toHaveClass('glass-tint-strong');
    });

    it('has no nested backdrop blur', () => {
        renderNavbar('/config');
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        const panel = screen.getAllByRole('link', { name: 'About' })[1].closest('.fixed');
        expect(panel?.parentElement?.closest('.glass-surface')).toBeNull();
    });

    it('closes the mobile menu when the viewport grows past the sm breakpoint', () => {
        let listener: ((event: MediaQueryListEvent) => void) | undefined;
        vi.stubGlobal('matchMedia', (query: string) => ({
            matches: false,
            media: query,
            addEventListener: (_: string, cb: (event: MediaQueryListEvent) => void) => {
                listener = cb;
            },
            removeEventListener: () => {
                listener = undefined;
            },
        }));
        renderNavbar('/config');
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        expect(document.body.style.overflow).toBe('hidden');

        act(() => listener?.({ matches: true } as MediaQueryListEvent));

        expect(screen.getByRole('button', { name: 'Open Menu' })).toHaveAttribute('aria-expanded', 'false');
        expect(document.body.style.overflow).toBe('');
    });

    it('renders without the PressResponder dev warning or any console warning or error', () => {
        const warn = vi.spyOn(console, 'warn');
        const error = vi.spyOn(console, 'error');
        renderNavbar('/config');
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
    });

    it('toggle has aria-controls pointing at the mobile panel', () => {
        renderNavbar('/config');
        const toggle = screen.getByRole('button', { name: 'Open Menu' });
        fireEvent.click(toggle);
        const panelId = toggle.getAttribute('aria-controls');
        expect(panelId).toBeTruthy();
        const panel = document.getElementById(panelId as string);
        expect(panel).not.toBeNull();
        expect(within(panel as HTMLElement).getByRole('link', { name: 'About' })).toBeInTheDocument();
    });

    it('moves focus into the panel when the menu opens', () => {
        renderNavbar('/config');
        const toggle = screen.getByRole('button', { name: 'Open Menu' });
        fireEvent.click(toggle);
        const panel = document.getElementById(toggle.getAttribute('aria-controls') as string);
        expect(panel).not.toBeNull();
        expect(panel?.contains(document.activeElement)).toBe(true);
    });

    it('Escape closes the menu and returns focus to the toggle', () => {
        renderNavbar('/config');
        const toggle = screen.getByRole('button', { name: 'Open Menu' });
        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');

        fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(toggle).toHaveAccessibleName('Open Menu');
        expect(document.activeElement).toBe(toggle);
    });

    it('makes the page content behind the open menu inert', () => {
        renderNavbar('/config');
        const content = screen.getByText('Other placeholder');
        expect(content).not.toHaveAttribute('inert');

        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        expect(content).toHaveAttribute('inert');
        expect(screen.getByRole('banner')).not.toHaveAttribute('inert');

        fireEvent.click(screen.getByRole('button', { name: 'Close Menu' }));
        expect(content).not.toHaveAttribute('inert');
    });

    it('closes the mobile menu and clears inert when the route changes', () => {
        renderNavbar('/config');
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        expect(screen.getByText('Other placeholder')).toHaveAttribute('inert');

        fireEvent.click(screen.getByRole('button', { name: 'Test navigate' }));

        expect(screen.getByRole('button', { name: 'Open Menu' })).toHaveAttribute('aria-expanded', 'false');
        const content = screen.getByText('About placeholder');
        expect(content).not.toHaveAttribute('inert');
        expect(document.querySelector('[inert]')).toBeNull();
    });

    it('Actions opens the drawer', () => {
        renderNavbar('/config');
        fireEvent.click(screen.getByRole('button', { name: /Actions/ }));
        expect(within(screen.getByRole('dialog')).getByText('Actions')).toBeInTheDocument();
    });

    it('closeDrawer from the accordion closes the drawer', async () => {
        localStorage.setItem(
            'savedWheels',
            JSON.stringify({
                w1: {
                    id: 'w1',
                    title: 'My Wheel',
                    encodedConfig: 'abc',
                    createdAt: '2020-01-01T00:00:00.000Z',
                    updatedAt: '2020-01-01T00:00:00.000Z',
                },
            })
        );
        renderNavbar('/config');
        fireEvent.click(screen.getByRole('button', { name: /Actions/ }));
        const dialog = screen.getByRole('dialog');

        fireEvent.click(within(dialog).getByRole('button', { name: 'Load this Wheel' }));

        await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(screen.getByText('Wheel placeholder')).toBeInTheDocument();
    });
});
