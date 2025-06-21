import { Button, ButtonGroup } from '@heroui/react';
import { useContext, useMemo } from 'react';
import { MdSave } from 'react-icons/md';
import { MdDeleteForever } from 'react-icons/md';
import { MdOutlinePlayCircleFilled } from 'react-icons/md';
import { useNavigate } from 'react-router';
import { ConfigContext } from '@/contexts/config';
import { SegmentContext } from '@/contexts/segment';
import { useSavedWheels } from '@/utils/local-storage';

interface SavedWheelsListProps {
    closeDrawer?: () => void;
}

export function SavedWheelsList({ closeDrawer }: SavedWheelsListProps) {
    const { encodedConfig, decodedConfig } = useContext(ConfigContext);
    const { setHasWinner } = useContext(SegmentContext);
    const { savedWheels, saveWheel, removeSavedWheel } = useSavedWheels();
    const navigate = useNavigate();

    const currentWheelIsSaved = useMemo(() => {
        return savedWheels.some((wheel) => wheel.id === decodedConfig?.id);
    }, [savedWheels, decodedConfig]);

    return (
        <div className="flex flex-col gap-4">
            {savedWheels.map((wheel) => (
                <div key={wheel.id} className="flex items-center justify-between">
                    <div>
                        <p className="max-w-full truncate">{wheel.title}</p>
                        {wheel.description && (
                            <p className="max-w-full truncate text-sm italic text-gray-400">{wheel.description}</p>
                        )}
                    </div>
                    <ButtonGroup>
                        <Button
                            isIconOnly
                            variant="flat"
                            color="primary"
                            onPress={() => {
                                setHasWinner?.(false);
                                navigate(`/wheel/v3/${encodeURIComponent(wheel.encodedConfig)}`);
                                closeDrawer?.();
                            }}
                            className="text-2xl"
                            title="Load this Wheel"
                        >
                            <MdOutlinePlayCircleFilled />
                        </Button>
                        <Button
                            isIconOnly
                            variant="flat"
                            color="danger"
                            onPress={() => {
                                removeSavedWheel(wheel.id);
                            }}
                            className="text-2xl"
                            title="Delete Saved Wheel"
                        >
                            <MdDeleteForever />
                        </Button>
                    </ButtonGroup>
                </div>
            ))}
            <Button
                className="w-full text-base"
                isDisabled={currentWheelIsSaved || !decodedConfig || !encodedConfig}
                startContent={<MdSave className="text-2xl" />}
                color="primary"
                onPress={() => {
                    saveWheel(decodedConfig, encodedConfig);
                }}
            >
                Save Current Wheel
            </Button>
            <div>
                <p className="text-center text-sm text-gray-500">
                    Wheels are saved locally to your browser. They are not synced between devices.
                </p>
            </div>
        </div>
    );
}
