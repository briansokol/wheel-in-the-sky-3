import { Config } from '@repo/shared/classes/config';
import { PageColorType } from '@repo/shared/enums/page-colors';
import { WheelColorType } from '@repo/shared/enums/wheel-colors';
import { ConfigFormInputs } from '@repo/shared/types/config';
import { configFormInputsSchema } from '@repo/shared/validators/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodingApi } from '@/server/encoding.js';
import { decodeConfig, encodeConfig } from '@/utils/encoding.js';

vi.mock('@/utils/encoding', async (importOriginal) => ({
    ...(await importOriginal()),
    encodeConfig: vi.fn(),
    decodeConfig: vi.fn(),
}));
vi.mock('@repo/shared/utils/colors', async (importOriginal) => ({
    ...(await importOriginal()),
    isPageColorTypeGradient: vi.fn(),
    getPageGradientTheme: vi.fn(),
}));

describe('encodingApi', () => {
    let mockFormData: ConfigFormInputs;

    beforeEach(() => {
        vi.resetAllMocks();
        mockFormData = {
            id: 'test-id',
            title: 'Test Wheel',
            description: 'Test description',
            names: JSON.stringify(['Name 1', 'Name 2']),
            randomizeOrder: true,
            showNames: true,
            colorSchemeType: WheelColorType.Random.toString(),
            backgroundColorType: PageColorType.GradientNight.toString(),
            baseColor: '#ff0000',
            randomizeColor: true,
            customColors: JSON.stringify(['#ff0000', '#00ff00', '#0000ff']),
            backgroundColor: '#ffffff',
        };
    });

    it('should use validated form data', async () => {
        expect(configFormInputsSchema.parse(mockFormData)).toBeTruthy();
    });

    describe('POST /encode', () => {
        it('should encode config from form data and return encoded result', async () => {
            vi.mocked(encodeConfig).mockResolvedValue('encoded-config-string');

            const response = await encodingApi.request('/encode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockFormData),
            });
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData).toEqual({ encodedConfig: 'encoded-config-string' });
            expect(encodeConfig).toHaveBeenCalled();
        });

        it('should handle single color background', async () => {
            mockFormData.backgroundColorType = PageColorType.Single.toString();
            vi.mocked(encodeConfig).mockResolvedValue('encoded-config-string');

            const response = await encodingApi.request('/encode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockFormData),
            });
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData).toEqual({ encodedConfig: 'encoded-config-string' });
            expect(encodeConfig).toHaveBeenCalled();
        });

        it('should handle errors during encoding', async () => {
            const mockError = new Error('Encoding failed');
            vi.mocked(encodeConfig).mockRejectedValue(mockError);

            const response = await encodingApi.request('/encode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockFormData),
            });
            const responseData = await response.json();

            expect(response.status).toBe(400);
            expect(responseData).toEqual({ error: mockError.message });
        });
    });

    describe('POST /decode', () => {
        it('should decode an encoded config string and return the resulting object', async () => {
            const mockRequestData = {
                encodedConfig: 'encoded-config-string',
            };
            const mockDecodedConfig = new Config();

            vi.mocked(decodeConfig).mockResolvedValue(mockDecodedConfig);

            const response = await encodingApi.request('/decode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockRequestData),
            });
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData).toEqual(mockDecodedConfig);
            expect(decodeConfig).toHaveBeenCalledWith('encoded-config-string');
        });

        it('should handle errors during decoding', async () => {
            const mockRequestData = {
                encodedConfig: 'invalid-encoded-config',
            };
            const mockError = new Error('Invalid config');
            vi.mocked(decodeConfig).mockRejectedValue(mockError);

            const response = await encodingApi.request('/decode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockRequestData),
            });
            const responseData = await response.json();

            expect(response.status).toBe(400);
            expect(responseData).toEqual({ error: mockError.message });
        });
    });
});
