import { WheelManager } from '@repo/shared/classes/wheel-manager';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_FOREGROUND_COLOR } from '@repo/shared/constants/colors';
import confetti from 'canvas-confetti';
import { useContext, useEffect, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import { GiPartyPopper } from 'react-icons/gi';
import { useNavigate, useParams } from 'react-router';
import { Wheel } from '@/components/wheel';
import { RotationContext } from '@/contexts/rotation';
import { SegmentContext } from '@/contexts/segment';
import { useBgColor, useFgColor, useSetDocumentBackgroundColor, useSetDocumentForegroundColor } from '@/hooks/colors';
import { useDecodedConfig } from '@/hooks/config';
import { calculateStartingRotation } from '@/utils/math';

export default function WheelPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    if (id === undefined || id === 'new') {
        navigate('/config/v3/new');
    }

    // TODO: Implement useDocumentTitle
    // useDocumentTitle(`The page description`);

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

    return (
        !isPending &&
        !isError &&
        segment && (
            <div className="mt-16 flex items-center justify-center">
                <div className="flex flex-col items-center text-center">
                    {wheelManager?.config?.title && <h2>{wheelManager?.config?.title}</h2>}
                    <h1 className="flex items-center justify-center space-x-2 text-center text-4xl font-bold">
                        {hasWinner && (
                            <span role="img" aria-label="Party Horn Emoji">
                                <GiPartyPopper />
                            </span>
                        )}
                        <span data-testid="winner" className="mx-4" aria-label="Winner">
                            {segment?.name}
                        </span>
                        {hasWinner && (
                            <span role="img" aria-label="Party Horn moji">
                                <GiPartyPopper />
                            </span>
                        )}
                    </h1>
                    <FaChevronDown className="mx-auto text-4xl" />
                    <Wheel wheelManager={wheelManager} radius="500px" />
                </div>
            </div>
        )
    );
}
