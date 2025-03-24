import { WheelManager } from '@repo/shared/classes/wheel-manager';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_FOREGROUND_COLOR } from '@repo/shared/constants/colors';
import { useDocumentTitle, useLockBodyScroll } from '@uidotdev/usehooks';
import confetti from 'canvas-confetti';
import { useContext, useEffect, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import { useNavigate, useParams } from 'react-router';
import { Wheel } from '@/components/wheel';
import { RotationContext } from '@/contexts/rotation';
import { SegmentContext } from '@/contexts/segment';
import { useBgColor, useFgColor, useSetDocumentBackgroundColor, useSetDocumentForegroundColor } from '@/hooks/colors';
import { useDecodedConfig } from '@/hooks/config';
import { useViewportWidth } from '@/hooks/viewport';
import { calculateStartingRotation } from '@/utils/math';

const WHEEL_PADDING = 20; // Padding of one side, applied to both sides

export default function WheelPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    if (id === undefined || id === 'new') {
        navigate('/config/v3/new');
    }

    const { rotation, setRotation } = useContext(RotationContext);
    const { segment, setSegment, hasWinner } = useContext(SegmentContext);

    const [wheelManager, setWheelManager] = useState<WheelManager>();

    const { data: decodedConfig, isError, isPending } = useDecodedConfig(id);

    useEffect(() => {
        if (decodedConfig !== undefined) {
            const newWheelManager = new WheelManager();
            newWheelManager.init(decodedConfig, []);
            setWheelManager(newWheelManager);
        }
    }, [decodedConfig]);

    useDocumentTitle(decodedConfig?.title ? `${decodedConfig.title} | Wheel in the Sky` : 'Wheel in the Sky');
    const viewportWidth = useViewportWidth();

    useEffect(() => {
        if (setRotation !== undefined && wheelManager !== undefined) {
            setRotation(calculateStartingRotation(wheelManager.segments.length));
        }
    }, [setRotation, wheelManager]);

    useEffect(() => {
        if (setRotation !== undefined && wheelManager !== undefined) {
            wheelManager.setRotationDispatch(setRotation);
        }
    }, [setRotation, wheelManager]);

    useEffect(() => {
        if (setSegment !== undefined && wheelManager !== undefined) {
            setSegment(wheelManager.getSegmentByRotation(rotation));
        }
    }, [rotation, setSegment, wheelManager]);

    useEffect(() => {
        if (wheelManager && hasWinner) {
            const colors = wheelManager.colors.map((color) => color.toHex());
            confetti({
                angle: 60,
                colors,
            });
            confetti({
                angle: 120,
                colors,
            });
        }
    }, [hasWinner, wheelManager]);

    const bgColor = useBgColor(
        decodedConfig,
        decodedConfig?.pageColorConfig?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR
    );
    const fgColor = useFgColor(
        decodedConfig,
        decodedConfig?.pageColorConfig?.foregroundColor ?? DEFAULT_FOREGROUND_COLOR
    );
    useSetDocumentBackgroundColor(bgColor);
    useSetDocumentForegroundColor(fgColor);

    useLockBodyScroll();

    return (
        !isPending &&
        !isError &&
        segment && (
            <div className="mt-16 flex items-center justify-center">
                <div className="flex flex-col items-center text-center">
                    {wheelManager?.config?.title && (
                        <h1 className="text-base sm:text-xl">{wheelManager?.config?.title}</h1>
                    )}
                    <p
                        className={`${hasWinner ? 'animate-float' : ''} flex items-center justify-center space-x-2 text-center text-xl font-bold sm:text-4xl`}
                    >
                        <span data-testid="winner" className="mx-4" aria-label="Winner">
                            {segment?.name}
                        </span>
                    </p>
                    <FaChevronDown className="mx-auto text-xl sm:text-4xl" />
                    <Wheel
                        wheelManager={wheelManager}
                        radius={
                            viewportWidth < 500 + WHEEL_PADDING * 2 ? `${viewportWidth - WHEEL_PADDING * 2}px` : '500px'
                        }
                    />
                </div>
            </div>
        )
    );
}
