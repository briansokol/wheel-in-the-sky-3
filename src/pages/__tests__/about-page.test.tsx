import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AboutPage from '../about-page';

function renderAboutPage() {
    return render(
        <MemoryRouter>
            <AboutPage />
        </MemoryRouter>
    );
}

describe('AboutPage', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the bundled changelog without fetching', () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        renderAboutPage();
        expect(screen.getByRole('heading', { name: 'Changelog' })).toBeInTheDocument();
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('does not list Hono', () => {
        renderAboutPage();
        expect(screen.queryByText('Hono')).not.toBeInTheDocument();
    });

    it('does not list Turborepo', () => {
        renderAboutPage();
        expect(screen.queryByText('Turborepo')).not.toBeInTheDocument();
    });
});
