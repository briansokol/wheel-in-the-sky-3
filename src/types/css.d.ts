import 'react';

type CustomProperties = Record<`--${string}`, string | number>;

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface CSSProperties extends CustomProperties {}
}
