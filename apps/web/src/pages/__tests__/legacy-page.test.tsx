import { encodeConfig } from '@repo/shared/utils/encoding';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Encoder } from '@/compatibility/v2/classes/encoder';
import LegacyPage from '../legacy-page';

vi.mock('@repo/shared/utils/encoding', () => ({ encodeConfig: vi.fn().mockResolvedValue('v5.encoded') }));

function legacyId(names: string): string {
    const oldId = Encoder.urlEncode({
        title: 'T',
        description: '',
        names,
        randomizeOrder: true,
        showNames: true,
        colorSchemeConfig: JSON.stringify({ colorSchemeType: 0 }),
        backgroundColorConfig: JSON.stringify({ backgroundColorType: 0 }),
    });
    // A slash would split the id across two path segments.
    expect(oldId).not.toContain('/');
    return oldId;
}

function renderLegacyPage(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/404" element={<p>Not found placeholder</p>} />
                <Route path="/:oldId" element={<LegacyPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('LegacyPage', () => {
    it('the call to action is disabled until a legacy config converts', () => {
        vi.mocked(encodeConfig).mockReturnValueOnce(new Promise(() => {}));
        renderLegacyPage(`/${legacyId('A\nB')}`);

        expect(screen.getByRole('button', { name: 'Upgrade Wheel' })).toBeDisabled();
    });

    it('sends an unconvertible legacy config to the 404 page', async () => {
        renderLegacyPage(`/${legacyId('')}`);

        expect(await screen.findByText('Not found placeholder')).toBeInTheDocument();
    });
});
