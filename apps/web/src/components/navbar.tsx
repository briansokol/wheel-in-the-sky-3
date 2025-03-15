import {
    Link,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
} from '@heroui/react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { PageBaseRoute } from '@/constants/routes';
import { isPage } from '@/utils/routes';

export function AppNavBar() {
    const { pathname } = useLocation();
    const params = useParams();
    const configId = params?.id ?? 'new';
    const uriEncodedConfigId = useMemo(() => encodeURIComponent(configId), [configId]);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
    }, [setIsMenuOpen]);

    const buildNavbarItems = useCallback(
        (Component: typeof NavbarItem | typeof NavbarMenuItem) => {
            return (
                <>
                    {configId !== 'new' && (
                        <Component isActive={isPage(pathname, PageBaseRoute.WheelV3)}>
                            <Link
                                color="foreground"
                                aria-current={isPage(pathname, PageBaseRoute.WheelV3) ? 'page' : 'false'}
                                href={`/wheel/v3/${uriEncodedConfigId}`}
                                onPress={closeMenu}
                            >
                                Wheel
                            </Link>
                        </Component>
                    )}
                    <Component isActive={isPage(pathname, PageBaseRoute.ConfigV3)}>
                        <Link
                            color="foreground"
                            aria-current={isPage(pathname, PageBaseRoute.ConfigV3) ? 'page' : 'false'}
                            href={`/config/v3/${uriEncodedConfigId}`}
                            onPress={closeMenu}
                        >
                            {configId === 'new' ? 'Create Wheel' : 'Configure'}
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
        [configId, uriEncodedConfigId, pathname, closeMenu]
    );

    const navbarItems = useMemo(() => {
        return buildNavbarItems(NavbarItem);
    }, [buildNavbarItems]);

    const navbarMenuItems = useMemo(() => {
        return buildNavbarItems(NavbarMenuItem);
    }, [buildNavbarItems]);

    return (
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
            <NavbarContent justify="end">
                {/*     <NavbarItem className="lg:flex">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="light" endContent={<FaAngleDown />}>
                                Favorites
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Favorite Wheel Actions" onAction={(key) => console.log(key)}>
                            <DropdownSection>
                                <DropdownItem key="add-favorite" color="success" endContent={<FaPlus />}>
                                    Add Favorite
                                </DropdownItem>
                                <DropdownItem
                                    key="remove-favorite"
                                    color="danger"
                                    endContent={<FaTrashCan />}
                                    showDivider
                                >
                                    Forget Favorite
                                </DropdownItem>
                            </DropdownSection>
                            <DropdownSection title="Favorite Wheels">
                                <DropdownItem
                                    key="wheel-1"
                                    description="Description of the wheel"
                                    endContent={<FaCheck />}
                                >
                                    Wheel 1
                                </DropdownItem>
                                <DropdownItem key="wheel-2" description="Description of the wheel">
                                    Wheel 2
                                </DropdownItem>
                            </DropdownSection>
                        </DropdownMenu>
                    </Dropdown>
                </NavbarItem> */}
            </NavbarContent>
            <NavbarMenu>{navbarMenuItems}</NavbarMenu>
        </Navbar>
    );
}
