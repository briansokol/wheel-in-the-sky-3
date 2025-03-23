import { Segment } from '@repo/shared/classes/segment';
import { type CSSProperties, type FC, memo, useMemo } from 'react';

interface WheelSegmentProps {
    segment: Segment;
}

export const WheelSegment: FC<WheelSegmentProps> = ({ segment }) => {
    const styles = useMemo(() => {
        const baseStyles: CSSProperties = {
            backgroundColor: segment.backgroundColor,
            transform: `rotate(-90deg) rotate(${segment.degrees / 2}deg) rotate(${segment.degrees * segment.index}deg)`,
            transformOrigin: '50% 50%',
        };

        if (segment.degrees === 180) {
            baseStyles.clipPath = `polygon(100% 0, 100% 100%, 50% 100%, 50% 0)`;
        } else if (segment.degrees < 180) {
            baseStyles.clipPath = `polygon(50% 50%, 100% ${segment.legStart}%, 100% ${segment.legEnd}%)`;
        }

        return baseStyles;
    }, [segment]);

    return (
        <div
            data-testid="wheel-segment"
            className="absolute top-0 box-border size-full text-right text-black"
            style={styles}
        >
            <div
                data-testid="wheel-segment-name"
                className="absolute right-5 top-1/2 text-right"
                style={{ color: segment.textColor, transformOrigin: 'right center', transform: 'translateY(-50%)' }}
            >
                {segment.name}
            </div>
        </div>
    );
};

export const MemoizedWheelSegment = memo(WheelSegment);
