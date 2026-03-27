/**
 * Test data fixtures for E2E tests.
 */

export const SAMPLE_WHEELS = {
    basic: {
        names: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
        title: 'Basic Wheel',
        description: 'A basic 5-person wheel',
    },
    detailed: {
        names: ['John', 'Jane', 'Jack', 'Jill', 'Joe', 'Jean', 'Jerry', 'Jessica'],
        title: 'Team Selector',
        description: 'Wheel for selecting team members for tasks',
        randomizeOrder: true,
        showNames: true,
    },
    singleName: {
        names: ['Prize'],
        title: 'Single Prize Wheel',
    },
    manyNames: {
        names: Array.from({ length: 20 }, (_, i) => `Person ${i + 1}`),
        title: 'Large Group Wheel',
        description: 'Wheel with 20 participants',
    },
};

export const COLOR_SCHEMES = {
    monochromatic: {
        type: 'Monochromatic',
        baseColor: '#FF6B6B',
    },
    analogous: {
        type: 'Analogous',
        baseColor: '#4ECDC4',
    },
    custom: {
        type: 'Custom',
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
    },
    random: {
        type: 'Random',
        baseColor: '#000000', // Not used for Random, but included for completeness
    },
};

export const BACKGROUND_OPTIONS = {
    default: 'Default',
    lightBlue: {
        type: 'Single',
        color: '#E8F4F8',
    },
    darkPurple: {
        type: 'Single',
        color: '#2D1B69',
    },
};

/**
 * Encodes a simple config for testing.
 * Note: In real tests, this should use the actual API to encode,
 * but this provides a fallback for testing.
 */
export function createMockEncodedConfig(): string {
    // Return a valid but minimal encoded config
    // This would need to be replaced with actual API encoding in real tests
    return 'eyJ2ZXJzaW9uIjozLCJpZCI6InRlc3Qtd2hlZWwiLCJ0aXRsZSI6IlRlc3QiLCJkZXNjcmlwdGlvbiI6IiIsIm5hbWVzIjpbIkFsaWNlIiwiQm9iIiwiQ2hhcmxpZSJdfQ==';
}

export const TEST_TIMEOUT = {
    short: 5000,
    normal: 10000,
    long: 30000,
    spin: 15000, // For wheel spinning animations
};

export const TEST_DELAYS = {
    animation: 500,
    formSubmission: 1000,
    pageLoad: 2000,
    windowClose: 500,
};
