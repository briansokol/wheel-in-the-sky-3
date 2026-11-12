import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import HomePage from '../home-page';

describe('HomePage', () => {
    it('the create-wheel call to action links to the config page', () => {
        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: 'Make a Wheel' })).toHaveAttribute('href', '/config');
    });
});
