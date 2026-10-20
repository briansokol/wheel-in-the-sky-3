import { Accordion } from '@heroui/react';
import { PageBaseRoute } from '@/constants/routes';
import { isPage } from '@/utils/routes';
import { RemovedWinnersList } from './removed-winners-list';
import { SavedWheelsList } from './saved-wheels-list';

interface ActionAccordionProps {
    pathname: string;
    closeDrawer?: () => void;
}

export function ActionAccordion({ pathname, closeDrawer }: ActionAccordionProps) {
    return (
        <Accordion allowsMultipleExpanded defaultExpandedKeys={['saved-wheels', 'removed-winners']}>
            <Accordion.Item id="saved-wheels" className="rounded-2xl glass-well">
                <Accordion.Heading>
                    <Accordion.Trigger>
                        Saved Wheels
                        <Accordion.Indicator />
                    </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                    <Accordion.Body>
                        <SavedWheelsList closeDrawer={closeDrawer} />
                    </Accordion.Body>
                </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item id="removed-winners" className="rounded-2xl glass-well">
                <Accordion.Heading>
                    <Accordion.Trigger>
                        Removed Winners
                        <Accordion.Indicator />
                    </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                    <Accordion.Body>
                        {isPage(pathname, PageBaseRoute.Wheel) ? (
                            <RemovedWinnersList closeDrawer={closeDrawer} />
                        ) : null}
                    </Accordion.Body>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
}
