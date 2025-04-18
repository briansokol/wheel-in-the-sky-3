import { Button } from '@heroui/react';
import { useCallback, useContext } from 'react';
import { MdRestore } from 'react-icons/md';
import { RemovedWinnersContext } from '@/contexts/removed-winners';

/**
 * Component that displays a list of removed winners with the ability to restore them.
 */
export function RemovedWinnersList() {
    const { removedWinners, setRemovedWinners } = useContext(RemovedWinnersContext);

    /**
     * Restores a winner by removing them from the removed winners list.
     *
     * @param {string} winner - The winner to restore
     * @returns {void}
     */
    const restoreWinner = useCallback(
        (winner: string) => {
            setRemovedWinners?.((prevWinners) => prevWinners.filter((w) => w !== winner));
        },
        [setRemovedWinners]
    );

    return (
        <div className="flex flex-col gap-2">
            {removedWinners.map((winner) => (
                <div key={winner} className="flex items-center justify-between">
                    <p className="max-w-[80%] truncate" title={winner}>
                        {winner}
                    </p>
                    <Button
                        isIconOnly
                        onPress={() => {
                            restoreWinner(winner);
                        }}
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
                    className="w-full"
                    isDisabled={removedWinners.length === 0}
                    startContent={<MdRestore />}
                    onPress={() => {
                        setRemovedWinners?.([]);
                    }}
                >
                    Restore All
                </Button>
            </div>
        </div>
    );
}
