import { Accordion, AccordionItem } from '@heroui/react';
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
        <Accordion selectionMode="multiple" defaultExpandedKeys={['saved-wheels', 'removed-winners']}>
            <AccordionItem key="saved-wheels" aria-label="Saved Wheels" title="Saved Wheels">
                <SavedWheelsList closeDrawer={closeDrawer} />
            </AccordionItem>
            <AccordionItem key="removed-winners" aria-label="Removed Winners" title="Removed Winners">
                {isPage(pathname, PageBaseRoute.WheelV3) ? <RemovedWinnersList closeDrawer={closeDrawer} /> : null}
            </AccordionItem>
        </Accordion>
    );
}
