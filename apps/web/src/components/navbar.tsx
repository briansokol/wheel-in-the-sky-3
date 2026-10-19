import { Button, Drawer, Link, Separator, useOverlayState } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaList } from 'react-icons/fa6';
import { useLocation, useSearchParams } from 'react-router';
import { PageBaseRoute } from '@/constants/routes';
import { isPage } from '@/utils/routes';
import { ActionAccordion } from './action-accordion';

const ITEM_CLASS = [
    'relative',
    'flex',
    'h-full',
    'items-center',
    "aria-[current=page]:after:content-['']",
    'aria-[current=page]:after:absolute',
    'aria-[current=page]:after:bottom-0',
    'aria-[current=page]:after:left-0',
    'aria-[current=page]:after:right-0',
    'aria-[current=page]:after:h-[2px]',
    'aria-[current=page]:after:rounded-[2px]',
    'aria-[current=page]:after:bg-accent',
].join(' ');

export function AppNavBar() {
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const currentEncodedConfig = searchParams.get('c');
    const configQuery = useMemo(
        () => (currentEncodedConfig ? `?c=${currentEncodedConfig}` : ''),
        [currentEncodedConfig]
    );

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const drawer = useOverlayState();

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
    }, [setIsMenuOpen]);

    useEffect(() => {
        if (!isMenuOpen) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    const buildNavbarItems = useCallback(
        (itemClassName: string) => {
            return (
                <>
                    {currentEncodedConfig && (
                        <Link
                            className={itemClassName}
                            aria-current={isPage(pathname, PageBaseRoute.Wheel) ? 'page' : undefined}
                            href={`${PageBaseRoute.Wheel}${configQuery}`}
                            onPress={closeMenu}
                        >
                            Wheel
                        </Link>
                    )}
                    <Link
                        className={itemClassName}
                        aria-current={isPage(pathname, PageBaseRoute.Config) ? 'page' : undefined}
                        href={`${PageBaseRoute.Config}${configQuery}`}
                        onPress={closeMenu}
                    >
                        {currentEncodedConfig ? 'Change Wheel' : 'Create Wheel'}
                    </Link>
                    <Link
                        className={itemClassName}
                        aria-current={isPage(pathname, PageBaseRoute.About) ? 'page' : undefined}
                        href={`/about`}
                        onPress={closeMenu}
                    >
                        About
                    </Link>
                </>
            );
        },
        [currentEncodedConfig, configQuery, pathname, closeMenu]
    );

    const navbarItems = useMemo(() => buildNavbarItems(ITEM_CLASS), [buildNavbarItems]);
    const navbarMenuItems = useMemo(() => buildNavbarItems('py-2'), [buildNavbarItems]);

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-separator bg-background/70 backdrop-blur-lg">
                <nav className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
                    <button
                        type="button"
                        className="-ml-2 flex size-10 items-center justify-center sm:hidden"
                        aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen((open) => !open)}
                    >
                        <span className="relative block h-0.5 w-6 bg-current before:absolute before:-top-2 before:h-0.5 before:w-6 before:bg-current after:absolute after:top-2 after:h-0.5 after:w-6 after:bg-current" />
                    </button>
                    <div className="flex-1 sm:flex-none">
                        <Link
                            aria-current={isPage(pathname, PageBaseRoute.Home) ? 'page' : undefined}
                            href={`/`}
                            className="font-bold text-inherit"
                        >
                            Wheel in the Sky
                        </Link>
                    </div>
                    <div className="hidden h-full flex-1 items-center justify-center gap-4 sm:flex">{navbarItems}</div>
                    <div className="hidden items-center justify-end gap-4 sm:flex">
                        <Button variant="ghost" onPress={drawer.open}>
                            Actions
                            <FaList />
                        </Button>
                    </div>
                </nav>
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            key="mobile-menu"
                            className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-background/90 backdrop-blur-lg sm:hidden"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                        >
                            <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-4">
                                {navbarMenuItems}
                                <Separator />
                                <ActionAccordion pathname={pathname} closeDrawer={closeMenu} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
            <Drawer state={drawer}>
                <Drawer.Backdrop>
                    <Drawer.Content placement="right">
                        <Drawer.Dialog className="sm:w-md">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>Actions</Drawer.Heading>
                            </Drawer.Header>
                            <Drawer.Body>
                                <ActionAccordion pathname={pathname} closeDrawer={drawer.close} />
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </Drawer>
        </>
    );
}
