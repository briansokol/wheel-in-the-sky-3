export interface Coordinates {
    x: number;
    y: number;
}

export enum RotationDirection {
    Clockwise = 1,
    CounterClockwise = -1,
    None = 0,
}

export enum Easing {
    In,
    Out,
    InOut,
}
