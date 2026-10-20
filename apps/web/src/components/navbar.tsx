import { Button, Drawer, Link, Separator, useOverlayState } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FaList } from 'react-icons/fa6';
import { useLocation, useSearchParams } from 'react-router';
import { PageBaseRoute } from '@/constants/routes';
import { isPage } from '@/utils/routes';
import { ActionAccordion } from './action-accordion';

const ITEM_CLASS =
    "relative flex h-full items-center aria-[current=page]:after:content-[''] aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-0 aria-[current=page]:after:right-0 aria-[current=page]:after:h-[2px] aria-[current=page]:after:rounded-[2px] aria-[current=page]:after:bg-accent aria-[current=page]:after:shadow-[0_0_8px_#c031e2]";

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

    const panelId = useId();
    const headerRef = useRef<HTMLElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
        toggleRef.current?.focus();
    }, [setIsMenuOpen]);

    // A nav link moves to a new page, so focus is left to the navigation instead of the toggle.
    const closeMenuOnNavigate = useCallback(() => {
        setIsMenuOpen(false);
    }, [setIsMenuOpen]);

    // The inert targets are chosen once on open, so a route change (e.g. browser Back) must close the menu.
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname, currentEncodedConfig]);

    useEffect(() => {
        if (!isMenuOpen) return;
        const panel = panelRef.current;
        panel?.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus();
        const background = Array.from(panel?.parentElement?.children ?? []).filter(
            (element) => element !== panel && element !== headerRef.current && !element.hasAttribute('inert')
        );
        background.forEach((element) => element.setAttribute('inert', ''));
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !event.defaultPrevented) closeMenu();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            background.forEach((element) => element.removeAttribute('inert'));
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isMenuOpen, closeMenu]);

    useEffect(() => {
        if (!isMenuOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMenuOpen]);

    useEffect(() => {
        if (!isMenuOpen || typeof window.matchMedia !== 'function') return;
        // Must match Tailwind's `sm` breakpoint (the `sm:` classes below).
        const query = window.matchMedia('(min-width: 640px)');
        const onChange = (event: MediaQueryListEvent) => {
            if (event.matches) closeMenu();
        };
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, [isMenuOpen, closeMenu]);

    const buildNavbarItems = useCallback(
        (itemClassName: string) => {
            return (
                <>
                    {currentEncodedConfig && (
                        <Link
                            className={itemClassName}
                            aria-current={isPage(pathname, PageBaseRoute.Wheel) ? 'page' : undefined}
                            href={`${PageBaseRoute.Wheel}${configQuery}`}
                            onPress={closeMenuOnNavigate}
                        >
                            Wheel
                        </Link>
                    )}
                    <Link
                        className={itemClassName}
                        aria-current={isPage(pathname, PageBaseRoute.Config) ? 'page' : undefined}
                        href={`${PageBaseRoute.Config}${configQuery}`}
                        onPress={closeMenuOnNavigate}
                    >
                        {currentEncodedConfig ? 'Change Wheel' : 'Create Wheel'}
                    </Link>
                    <Link
                        className={itemClassName}
                        aria-current={isPage(pathname, PageBaseRoute.About) ? 'page' : undefined}
                        href={PageBaseRoute.About}
                        onPress={closeMenuOnNavigate}
                    >
                        About
                    </Link>
                </>
            );
        },
        [currentEncodedConfig, configQuery, pathname, closeMenuOnNavigate]
    );

    const navbarItems = useMemo(() => buildNavbarItems(ITEM_CLASS), [buildNavbarItems]);
    const navbarMenuItems = useMemo(() => buildNavbarItems('py-2'), [buildNavbarItems]);

    return (
        <>
            <header ref={headerRef} className="sticky top-2 z-40 mx-2 rounded-2xl glass-surface sm:mx-4">
                <nav className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
                    <Button
                        ref={toggleRef}
                        isIconOnly
                        variant="ghost"
                        className="-ml-2 sm:hidden"
                        aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}
                        aria-expanded={isMenuOpen}
                        aria-controls={panelId}
                        onPress={() => (isMenuOpen ? closeMenu() : setIsMenuOpen(true))}
                    >
                        <span className="relative block h-0.5 w-6 bg-current before:absolute before:-top-2 before:h-0.5 before:w-6 before:bg-current after:absolute after:top-2 after:h-0.5 after:w-6 after:bg-current" />
                    </Button>
                    <div className="flex-1 sm:flex-none">
                        <Link
                            aria-current={isPage(pathname, PageBaseRoute.Home) ? 'page' : undefined}
                            href={PageBaseRoute.Home}
                            className="font-bold text-inherit"
                        >
                            Wheel in the Sky
                        </Link>
                    </div>
                    <div className="hidden h-full flex-1 items-center justify-center gap-4 sm:flex">{navbarItems}</div>
                    <div className="hidden items-center justify-end gap-4 sm:flex">
                        <Drawer state={drawer}>
                            <Button variant="ghost" className="rounded-full bg-white/10 glass-rim">
                                Actions
                                <FaList />
                            </Button>
                            <Drawer.Backdrop>
                                <Drawer.Content placement="right">
                                    <Drawer.Dialog className="rounded-l-2xl glass-surface sm:w-md">
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
                    </div>
                </nav>
            </header>
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        key="mobile-menu"
                        ref={panelRef}
                        id={panelId}
                        className="fixed inset-x-2 top-[4.75rem] bottom-2 z-40 overflow-y-auto rounded-2xl glass-surface sm:hidden"
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
        </>
    );
}
