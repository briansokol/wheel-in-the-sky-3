import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react';
import { WheelManager } from '@repo/shared/classes/wheel-manager';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_FOREGROUND_COLOR } from '@repo/shared/constants/colors';
import { useDocumentTitle, useLockBodyScroll } from '@uidotdev/usehooks';
import confetti from 'canvas-confetti';
import { RefObject, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import { LuClipboardCopy } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router';
import { Banner } from '@/components/banner';
import { Wheel } from '@/components/wheel';
import { ConfigContext } from '@/contexts/config';
import { RemovedWinnersContext } from '@/contexts/removed-winners';
import { RotationContext } from '@/contexts/rotation';
import { SegmentContext } from '@/contexts/segment';
import { useBgColor, useFgColor, useSetDocumentBackgroundColor, useSetDocumentForegroundColor } from '@/hooks/colors';
import { useDecodedConfig } from '@/hooks/config';
import { useSmallestViewportDimension } from '@/hooks/viewport';
import { useSavedWheels } from '@/utils/local-storage';
import { calculateStartingRotation } from '@/utils/math';

const WHEEL_PADDING = 60; // Padding of one side, applied to both sides
const MIN_WHEEL_DIAMETER = 800; // Minimum wheel diameter

function getBanner(bannerRef: RefObject<HTMLCanvasElement | null>) {
    if (bannerRef.current === null) {
        return;
    }
    bannerRef.current.toBlob((blob) => navigator.clipboard.write([new ClipboardItem({ 'image/png': blob as Blob })]));
}

export default function WheelPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { setDecodedConfig, setEncodedConfig } = useContext(ConfigContext);
    const { updateWheelIfSaved } = useSavedWheels();

    if (id === undefined || id === 'new') {
        navigate('/config/v3/new');
    }

    const { rotation, setRotation } = useContext(RotationContext);
    const { segment, setSegment, hasWinner, setHasWinner } = useContext(SegmentContext);
    const { removedWinners, setRemovedWinners } = useContext(RemovedWinnersContext);

    const [wheelManager, setWheelManager] = useState<WheelManager>();

    const { data: decodedConfig, isError, isPending } = useDecodedConfig(id);

    useMemo(() => {
        updateWheelIfSaved(decodedConfig, id);
    }, [decodedConfig, id, updateWheelIfSaved]);

    useEffect(() => {
        if (setDecodedConfig && setEncodedConfig) {
            if (decodedConfig !== undefined && id !== undefined && id !== 'new') {
                setDecodedConfig(decodedConfig);
                setEncodedConfig(id);
            } else {
                setDecodedConfig(undefined);
                setEncodedConfig(undefined);
            }
        }
    }, [setDecodedConfig, setEncodedConfig, decodedConfig, id]);

    useEffect(() => {
        if (decodedConfig !== undefined) {
            const newWheelManager = new WheelManager();
            newWheelManager.init(decodedConfig, removedWinners);
            setWheelManager(newWheelManager);
        }
    }, [decodedConfig, removedWinners]);

    useDocumentTitle(decodedConfig?.title ? `${decodedConfig.title} | Wheel in the Sky` : 'Wheel in the Sky');
    const viewportSize = useSmallestViewportDimension();
    const bannerRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (setRotation !== undefined && wheelManager !== undefined) {
            setRotation(calculateStartingRotation(wheelManager.segments.length));
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
            <main className="min-h-screen">
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
                    <FaChevronDown className="relative top-[8px] z-10 mx-auto text-xl drop-shadow-lg sm:top-[15px] sm:text-4xl" />
                    <Wheel
                        wheelManager={wheelManager}
                        diameter={
                            viewportSize < MIN_WHEEL_DIAMETER + WHEEL_PADDING * 2
                                ? `${viewportSize - WHEEL_PADDING * 2}px`
                                : `${MIN_WHEEL_DIAMETER}px`
                        }
                    />
                    {hasWinner && (
                        <Card
                            isBlurred
                            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 overflow-visible bg-background/50 dark:bg-default-100/50"
                            shadow="lg"
                        >
                            {wheelManager?.config?.title && (
                                <CardHeader className="flex items-center justify-center">
                                    <h1 className="text-base sm:text-xl">{wheelManager?.config?.title}</h1>
                                </CardHeader>
                            )}
                            <CardBody className="overflow-visible">
                                <p className="flex animate-float items-center justify-center space-x-2 overflow-visible text-center text-xl font-bold sm:text-4xl">
                                    <span data-testid="winner" aria-label="Winner">
                                        {segment?.name}
                                    </span>
                                </p>
                            </CardBody>
                            <CardFooter className="flex items-center justify-center">
                                <Button
                                    color="default"
                                    radius="lg"
                                    size="md"
                                    variant="flat"
                                    className="mx-1"
                                    startContent={<LuClipboardCopy className="text-xl" />}
                                    onPress={() => getBanner(bannerRef)}
                                >
                                    Copy Banner
                                </Button>
                                <Button
                                    color="default"
                                    radius="lg"
                                    size="md"
                                    variant="flat"
                                    className="mx-1"
                                    startContent={<IoRemoveCircleOutline className="text-xl" />}
                                    onPress={() => {
                                        if (segment?.name && setRemovedWinners && setHasWinner) {
                                            setRemovedWinners([...removedWinners, segment.name]);
                                            setHasWinner(false);
                                        }
                                    }}
                                >
                                    Remove Winner
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
                {hasWinner && (
                    <div className="invisible fixed -left-96 -top-96">
                        <Banner bannerRef={bannerRef} wheelManager={wheelManager} winner={segment} />
                    </div>
                )}
            </main>
        )
    );
}
