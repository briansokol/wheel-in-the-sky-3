import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import LegacyPage from '../legacy-page';

vi.mock('@/hooks/config', () => ({
    useEncodeConfigMutation: () => ({ mutateAsync: vi.fn() }),
}));

describe('LegacyPage', () => {
    it('the call to action is disabled until a legacy config decodes', () => {
        render(
            <MemoryRouter initialEntries={['/legacy']}>
                <LegacyPage />
            </MemoryRouter>
        );

        expect(screen.getByRole('button', { name: 'Upgrade Wheel' })).toBeDisabled();
    });
});
