export function calculateStartingRotation(segmentCount: number): number {
    if (segmentCount <= 0) {
        return 0;
    }

    return -(360 / segmentCount) / 2 + 360;
}
