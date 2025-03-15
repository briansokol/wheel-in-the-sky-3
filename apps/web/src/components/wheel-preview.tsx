import { TinyColor } from '@ctrl/tinycolor';
import { Card } from '@heroui/react';
import { Config } from '@repo/shared/classes/config';
import { WheelManager } from '@repo/shared/classes/wheel-manager';
import { DEFAULT_FOREGROUND_COLOR, INVERSE_FOREGROUND_COLOR } from '@repo/shared/constants/colors';
import { PageColorType } from '@repo/shared/enums/page-colors';
import { WheelColorType } from '@repo/shared/enums/wheel-colors';
import { buildPageColorConfig, buildWheelColorConfig } from '@repo/shared/utils/configs';
import { FC, useContext, useEffect, useMemo } from 'react';
import { Wheel } from '@/components/wheel';
import { RotationContext } from '@/contexts/rotation';
import { useBgColor, useFgColor } from '@/hooks/colors';
import { calculateStartingRotation } from '@/utils/math';

interface WheelPreviewProps {
    title: string;
    description: string;
    names: string;
    randomizeOrder: boolean;
    wheelColorType: WheelColorType;
    baseColor?: string;
    colors?: string[];
    randomizeColor?: boolean;
    pageColorType: PageColorType;
    backgroundColor: string;
    showNames: boolean;
    isSelected?: boolean;
    height?: string;
}

export const WheelPreview: FC<WheelPreviewProps> = ({
    title,
    names,
    randomizeOrder,
    wheelColorType,
    baseColor,
    colors,
    randomizeColor,
    pageColorType,
    backgroundColor,
    showNames,
    height,
}) => {
    const { setRotation } = useContext(RotationContext);

    const [config, wheelManager] = useMemo(() => {
        const newConfig = new Config();
        newConfig.wheelColorConfig = buildWheelColorConfig(
            wheelColorType,
            baseColor ?? '',
            colors ?? [],
            randomizeColor ?? false
        );

        let foregroundColor = '';
        if (pageColorType === PageColorType.Single) {
            foregroundColor = new TinyColor(backgroundColor).isDark()
                ? DEFAULT_FOREGROUND_COLOR
                : INVERSE_FOREGROUND_COLOR;
        }

        newConfig.pageColorConfig = buildPageColorConfig(pageColorType, backgroundColor, foregroundColor);

        newConfig.setNames(names);
        newConfig.setRandomizeOrder(randomizeOrder);
        newConfig.setShowNames(showNames);

        const newWheelManager = new WheelManager();
        newWheelManager.init(newConfig, []);

        return [newConfig, newWheelManager];
    }, [
        names,
        randomizeOrder,
        wheelColorType,
        baseColor,
        colors,
        randomizeColor,
        pageColorType,
        backgroundColor,
        showNames,
    ]);

    useEffect(() => {
        if (setRotation && wheelManager) {
            setRotation(calculateStartingRotation(wheelManager?.segments?.length ?? 0));
        }
    }, [setRotation, wheelManager]);

    const bgColor = useBgColor(config, config.pageColorConfig.backgroundColor);
    const fgColor = useFgColor(config, config.pageColorConfig.foregroundColor);

    return (
        <Card className="w-full" shadow="lg" style={{ height: height ?? '400px', background: bgColor }}>
            {names.length > 0 ? (
                <div className="flex h-full flex-col items-center justify-center overflow-hidden">
                    <div
                        className="flex translate-y-8 items-center justify-center text-xl transition-all"
                        style={{ color: fgColor }}
                    >
                        {title}
                    </div>
                    <div className="flex size-full translate-y-28 items-center justify-center transition-all">
                        <Wheel wheelManager={wheelManager} radius="70%" isStatic={true} />
                    </div>
                </div>
            ) : (
                <div className="flex h-full items-center justify-center overflow-hidden" style={{ color: fgColor }}>
                    Add at Least 1 Wheel Segment
                </div>
            )}
        </Card>
    );
};
