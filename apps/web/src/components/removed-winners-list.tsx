import { Button } from '@heroui/react';
import { useCallback } from 'react';
import { MdRestore } from 'react-icons/md';
import { useRemovedWinners } from '@/contexts/removed-winners';
import { useSegment } from '@/contexts/segment';

interface RemovedWinnersListProps {
    closeDrawer?: () => void;
}

/**
 * Component that displays a list of removed winners with the ability to restore them.
 */
export function RemovedWinnersList({ closeDrawer }: RemovedWinnersListProps) {
    const { removedWinners, setRemovedWinners } = useRemovedWinners();
    const { setHasWinner } = useSegment();

    /**
     * Restores a winner by removing them from the removed winners list.
     *
     * @param {string} winner - The winner to restore
     * @returns {void}
     */
    const restoreWinner = useCallback(
        (winner: string) => {
            setRemovedWinners((prevWinners) => prevWinners.filter((w) => w !== winner));
            setHasWinner(false);
        },
        [setRemovedWinners, setHasWinner]
    );

    return (
        <div className="flex flex-col gap-4">
            {removedWinners.map((winner) => (
                <div key={winner} className="flex items-center justify-between">
                    <p className="max-w-[80%] truncate" title={winner}>
                        {winner}
                    </p>
                    <Button
                        isIconOnly
                        variant="flat"
                        color="primary"
                        onPress={() => {
                            restoreWinner(winner);
                            closeDrawer?.();
                        }}
                        className="text-2xl"
                    >
                        <MdRestore />
                    </Button>
                </div>
            ))}
            {removedWinners.length === 0 && (
                <div>
                    <p className="text-center text-gray-500">No removed winners</p>
                </div>
            )}
            <div>
                <Button
                    className="w-full text-base"
                    color="primary"
                    isDisabled={removedWinners.length === 0}
                    startContent={<MdRestore className="text-2xl" />}
                    onPress={() => {
                        setRemovedWinners?.([]);
                        closeDrawer?.();
                    }}
                >
                    Restore All
                </Button>
            </div>
        </div>
    );
}
