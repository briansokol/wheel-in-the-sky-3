import {
    Button,
    Divider,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerHeader,
    Link,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
    useDisclosure,
} from '@heroui/react';
import { useCallback, useMemo, useState } from 'react';
import { FaList } from 'react-icons/fa6';
import { useLocation, useSearchParams } from 'react-router';
import { PageBaseRoute } from '@/constants/routes';
import { isPage } from '@/utils/routes';
import { ActionAccordion } from './action-accordion';

export function AppNavBar() {
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const currentEncodedConfig = searchParams.get('c');
    const configQuery = useMemo(
        () => (currentEncodedConfig ? `?c=${currentEncodedConfig}` : ''),
        [currentEncodedConfig]
    );

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onOpenChange: onDrawerOpenChange } = useDisclosure();

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
    }, [setIsMenuOpen]);

    const buildNavbarItems = useCallback(
        (Component: typeof NavbarItem | typeof NavbarMenuItem) => {
            return (
                <>
                    {currentEncodedConfig && (
                        <Component isActive={isPage(pathname, PageBaseRoute.Wheel)}>
                            <Link
                                color="foreground"
                                aria-current={isPage(pathname, PageBaseRoute.Wheel) ? 'page' : 'false'}
                                href={`${PageBaseRoute.Wheel}${configQuery}`}
                                onPress={closeMenu}
                            >
                                Wheel
                            </Link>
                        </Component>
                    )}
                    <Component isActive={isPage(pathname, PageBaseRoute.Config)}>
                        <Link
                            color="foreground"
                            aria-current={isPage(pathname, PageBaseRoute.Config) ? 'page' : 'false'}
                            href={`${PageBaseRoute.Config}${configQuery}`}
                            onPress={closeMenu}
                        >
                            {currentEncodedConfig ? 'Change Wheel' : 'Create Wheel'}
                        </Link>
                    </Component>
                    <Component isActive={isPage(pathname, PageBaseRoute.About)}>
                        <Link
                            color="foreground"
                            aria-current={isPage(pathname, PageBaseRoute.About) ? 'page' : 'false'}
                            href={`/about`}
                            onPress={closeMenu}
                        >
                            About
                        </Link>
                    </Component>
                </>
            );
        },
        [currentEncodedConfig, configQuery, pathname, closeMenu]
    );

    const navbarItems = useMemo(() => {
        return buildNavbarItems(NavbarItem);
    }, [buildNavbarItems]);

    const navbarMenuItems = useMemo(() => {
        return buildNavbarItems(NavbarMenuItem);
    }, [buildNavbarItems]);

    return (
        <>
            <Navbar
                isMenuOpen={isMenuOpen}
                onMenuOpenChange={setIsMenuOpen}
                classNames={{
                    item: [
                        'flex',
                        'relative',
                        'h-full',
                        'items-center',
                        "data-[active=true]:after:content-['']",
                        'data-[active=true]:after:absolute',
                        'data-[active=true]:after:bottom-0',
                        'data-[active=true]:after:left-0',
                        'data-[active=true]:after:right-0',
                        'data-[active=true]:after:h-[2px]',
                        'data-[active=true]:after:rounded-[2px]',
                        'data-[active=true]:after:bg-primary',
                    ],
                }}
            >
                <NavbarMenuToggle aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'} className="sm:hidden" />
                <NavbarBrand>
                    <Link
                        color="foreground"
                        aria-current={isPage(pathname, PageBaseRoute.Home) ? 'page' : 'false'}
                        href={`/`}
                    >
                        <p className="font-bold text-inherit">Wheel in the Sky</p>
                    </Link>
                </NavbarBrand>
                <NavbarContent className="hidden gap-4 sm:flex" justify="center">
                    {navbarItems}
                </NavbarContent>
                <NavbarContent className="hidden gap-4 sm:flex" justify="end">
                    <NavbarItem>
                        <Button variant="light" endContent={<FaList />} onPress={onDrawerOpen}>
                            Actions
                        </Button>
                    </NavbarItem>
                </NavbarContent>
                <NavbarMenu>
                    {navbarMenuItems}
                    <Divider />
                    <ActionAccordion pathname={pathname} closeDrawer={closeMenu} />
                </NavbarMenu>
            </Navbar>
            <Drawer isOpen={isDrawerOpen} onOpenChange={onDrawerOpenChange} size="md">
                <DrawerContent>
                    {() => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1">Actions</DrawerHeader>
                            <DrawerBody>
                                <ActionAccordion pathname={pathname} closeDrawer={onDrawerOpenChange} />
                            </DrawerBody>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
}
