import { Link } from '@heroui/react';
import { defaultPageColorConfig } from '@repo/shared/constants/colors';
import {
    SiCloudflare,
    SiEslint,
    SiGithub,
    SiHono,
    SiNextui,
    SiPrettier,
    SiReact,
    SiTailwindcss,
    SiTestinglibrary,
    SiTurborepo,
    SiVite,
    SiVitest,
} from 'react-icons/si';
import Markdown from 'react-markdown';
import { useChangeLog } from '@/hooks/changelog';
import { useSetDocumentBackgroundColor, useSetDocumentForegroundColor } from '@/hooks/colors';

const currentYear = new Date().getFullYear();

export default function AboutPage() {
    useSetDocumentBackgroundColor(defaultPageColorConfig.backgroundColor);
    useSetDocumentForegroundColor(defaultPageColorConfig.foregroundColor);

    const { data: changelog, isError } = useChangeLog();

    return (
        <main className="flex min-h-screen flex-col items-center px-4 py-8">
            <div className="container mx-auto max-w-3xl">
                <article data-testid="about-text" className="mb-12 text-lg">
                    <h1 className="my-4 text-4xl font-bold">About Wheel in the Sky</h1>
                    <p className="my-4">
                        <em>Wheel in the Sky</em> is a wheel-based solution for randomly choosing from set list of
                        options. It was created by Brian Sokol to fairly choose people to lead meetings at work.
                    </p>
                    <p className="my-4">
                        Wheel configuration is stored entirely in the URL so you can share your wheels with anyone. You
                        don&apos;t need an account. We only use cookies to store local configuration. We do not use
                        cookies to track you across websites, and we do not have ads.
                    </p>
                    <p className="my-4">This app is built on these very cool technologies:</p>
                    <ul data-testid="technology-links" className="list-inside list-disc">
                        <li>
                            <SiReact className="inline-block align-[-3px]" />{' '}
                            <Link href="https://reactjs.org">
                                React
                                <Link.Icon />
                            </Link>
                        </li>
                        <li>
                            <SiNextui className="inline-block align-[-3px]" />{' '}
                            <Link href="https://www.heroui.com/">
                                HeroUI
                                <Link.Icon />
                            </Link>
                        </li>
                        <li>
                            <SiTailwindcss className="inline-block align-[-3px]" />{' '}
                            <Link href="https://tailwindcss.com/">
                                Tailwind
                                <Link.Icon />
                            </Link>
                        </li>
                        <li>
                            <SiHono className="inline-block align-[-3px]" />{' '}
                            <Link href="https://hono.dev/">
                                Hono
                                <Link.Icon />
                            </Link>
                        </li>
                    </ul>
                    <p className="my-4">And it&apos;s supported by these awesome libraries:</p>
                    <ul data-testid="library-links" className="list-inside list-disc">
                        <li>
                            <SiVite className="inline-block align-[-3px]" />{' '}
                            <Link href="https://vite.dev/">
                                Vite
                                <Link.Icon />
                            </Link>
                        </li>
                        <li>
                            <SiTurborepo className="inline-block align-[-3px]" />{' '}
                            <Link href="https://turbo.build/repo/docs">
                                Turborepo
                                <Link.Icon />
                            </Link>
                        </li>
                        <li>
                            <SiVitest className="inline-block align-[-3px]" />{' '}
                            <Link href="https://vitest.dev/">
                                Vitest
                                <Link.Icon />
                            </Link>
                        </li>
                        <li>
                            <SiTestinglibrary className="inline-block align-[-3px]" />{' '}
                            <Link href="https://testing-library.com/">
                                Testing Library
                                <Link.Icon />
                            </Link>
                        </li>
                        <li>
                            <SiEslint className="inline-block align-[-3px]" />{' '}
                            <Link href="https://eslint.org/">
                                ESLint
                                <Link.Icon />
                            </Link>
                        </li>
                        <li>
                            <SiPrettier className="inline-block align-[-3px]" />{' '}
                            <Link href="https://prettier.io/">
                                Prettier
                                <Link.Icon />
                            </Link>
                        </li>
                    </ul>
                    <p>
                        It&apos;s hosted on <SiCloudflare className="inline-block align-[-3px] text-xl" />{' '}
                        <Link href="https://www.cloudflare.com/">
                            Cloudflare
                            <Link.Icon />
                        </Link>
                        .
                    </p>
                    <p>
                        Source code is available at <SiGithub className="inline-block align-[-3px]" />{' '}
                        <Link href="https://github.com/briansokol/wheel-in-the-sky-3">
                            GitHub
                            <Link.Icon />
                        </Link>
                        .
                    </p>
                    <p className="my-4">©{currentYear} Brian Sokol. All rights reserved.</p>
                </article>
                <article data-testid="changelog-text" className="mt-12">
                    {isError ? (
                        <p className="my-4">Sorry, I couldn&apos;t load the changelog.</p>
                    ) : !changelog?.startsWith('<!doctype html>') ? (
                        <Markdown
                            components={{
                                h1(props) {
                                    return <h1 className="my-4 text-4xl font-bold">{props.children}</h1>;
                                },
                                h2(props) {
                                    return (
                                        <h2 className="mt-12 mb-4 border-b-1 text-2xl font-bold">{props.children}</h2>
                                    );
                                },
                                h3(props) {
                                    return <h3 className="my-4 text-lg font-bold">{props.children}</h3>;
                                },
                                a(props) {
                                    const isExternalLink: boolean =
                                        !!props.href &&
                                        !!props.href.startsWith('http') &&
                                        (typeof window === 'undefined' ||
                                            !props.href.startsWith(window.location.origin));

                                    return (
                                        <Link href={props.href} className="text-[length:inherit]">
                                            {props.children}
                                            {isExternalLink && <Link.Icon />}
                                        </Link>
                                    );
                                },
                                ul(props) {
                                    return <ul className="my-4 list-disc pl-8">{props.children}</ul>;
                                },
                            }}
                        >
                            {changelog}
                        </Markdown>
                    ) : null}
                </article>
            </div>
        </main>
    );
}
