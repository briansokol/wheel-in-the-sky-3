import { Accordion, AccordionItem } from '@heroui/react';
import { PageBaseRoute } from '@/constants/routes';
import { isPage } from '@/utils/routes';
import { RemovedWinnersList } from './removed-winners-list';

interface ActionAccordionProps {
    pathname: string;
}

export function ActionAccordion({ pathname }: ActionAccordionProps) {
    return (
        <Accordion selectionMode="multiple" defaultExpandedKeys={['saved-wheels', 'removed-winners']}>
            <AccordionItem key="saved-wheels" aria-label="Saved Wheels" title="Saved Wheels">
                Coming Soon!
            </AccordionItem>
            <AccordionItem key="removed-winners" aria-label="Removed Winners" title="Removed Winners">
                {isPage(pathname, PageBaseRoute.WheelV3) ? <RemovedWinnersList /> : null}
            </AccordionItem>
        </Accordion>
    );
}
