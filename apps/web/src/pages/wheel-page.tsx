import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react';
import { WheelManager } from '@repo/shared/classes/wheel-manager';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_FOREGROUND_COLOR } from '@repo/shared/constants/colors';
import { useDocumentTitle, useLockBodyScroll } from '@uidotdev/usehooks';
import confetti from 'canvas-confetti';
import { RefObject, useEffect, useMemo, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import { LuClipboardCopy } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router';
import { Banner } from '@/components/banner';
import { Wheel } from '@/components/wheel';
import { useConfig } from '@/contexts/config';
import { useRemovedWinners } from '@/contexts/removed-winners';
import { useRotation } from '@/contexts/rotation';
import { useSegment } from '@/contexts/segment';
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
    const { setDecodedConfig, setEncodedConfig } = useConfig();
    const { updateWheelIfSaved } = useSavedWheels();

    if (id === undefined || id === 'new') {
        navigate('/config/v3/new');
    }

    const { rotation, setRotation } = useRotation();
    const { segment, setSegment, hasWinner, setHasWinner } = useSegment();
    const { removedWinners, setRemovedWinners } = useRemovedWinners();

    const { data: decodedConfig, isError, isPending } = useDecodedConfig(id);

    useEffect(() => {
        updateWheelIfSaved(decodedConfig, id);
    }, [decodedConfig, id, updateWheelIfSaved]);

    useEffect(() => {
        if (decodedConfig !== undefined && id !== undefined && id !== 'new') {
            setDecodedConfig(decodedConfig);
            setEncodedConfig(id);
        } else {
            setDecodedConfig(undefined);
            setEncodedConfig(undefined);
        }
    }, [setDecodedConfig, setEncodedConfig, decodedConfig, id]);

    // Optimization: Create stable string representation of removedWinners array contents
    // to prevent unnecessary WheelManager recreation when array reference changes.
    // The wheelManager only cares about the actual winner names, not the array reference.
    // We sort the names to ensure consistent key generation regardless of removal order.
    // Using newline as separator since segment names are parsed by splitting on newlines.
    const removedWinnersKey = useMemo(() => [...removedWinners].sort().join('\n'), [removedWinners]);

    const wheelManager = useMemo(() => {
        if (decodedConfig !== undefined) {
            const newWheelManager = new WheelManager();
            // Parse removedWinnersKey back to array for init
            const winnersArray = removedWinnersKey ? removedWinnersKey.split('\n') : [];
            newWheelManager.init(decodedConfig, winnersArray);
            return newWheelManager;
        }
        return undefined;
    }, [decodedConfig, removedWinnersKey]);

    useDocumentTitle(decodedConfig?.title ? `${decodedConfig.title} | Wheel in the Sky` : 'Wheel in the Sky');
    const viewportSize = useSmallestViewportDimension();
    const bannerRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (wheelManager !== undefined) {
            setRotation(calculateStartingRotation(wheelManager.segments.length));
        }
    }, [setRotation, wheelManager]);

    useEffect(() => {
        if (wheelManager !== undefined) {
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

    if (isPending) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-foreground border-t-transparent"></div>
                    <p className="text-lg">Loading wheel...</p>
                </div>
            </main>
        );
    }

    if (isError) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader className="flex flex-col items-center">
                        <h2 className="text-xl font-bold">Unable to load wheel</h2>
                    </CardHeader>
                    <CardBody className="text-center">
                        <p className="mb-4">Please check your configuration and try again.</p>
                    </CardBody>
                    <CardFooter className="flex justify-center">
                        <Button color="primary" variant="flat" onPress={() => navigate('/config/v3/new')}>
                            Go to Configuration
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        );
    }

    if (!segment) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader className="flex flex-col items-center">
                        <h2 className="text-xl font-bold">No segments found</h2>
                    </CardHeader>
                    <CardBody className="text-center">
                        <p className="mb-4">Please add at least one segment to the wheel.</p>
                    </CardBody>
                    <CardFooter className="flex justify-center">
                        <Button color="primary" variant="flat" onPress={() => navigate('/config/v3/new')}>
                            Add Segments
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
                <FaChevronDown className="relative top-2 z-10 mx-auto text-xl drop-shadow-lg sm:top-4 sm:text-4xl" />
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
                        className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 overflow-visible bg-background/50 dark:bg-default-100/50"
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
                                    if (segment?.name) {
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
                <div className="invisible fixed -top-96 -left-96">
                    <Banner bannerRef={bannerRef} wheelManager={wheelManager} winner={segment} />
                </div>
            )}
        </main>
    );
}
