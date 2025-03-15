import { Link } from '@heroui/react';
import { FaGithub } from 'react-icons/fa6';
import Markdown from 'react-markdown';

// TODO: Temporary until I can fetch the changelog from the server
const error = false;
const changelog = '# Changelog TBD';

const currentYear = new Date().getFullYear();

export default function AboutPage() {
    return (
        <main className="flex min-h-screen flex-col items-center px-4 py-8">
            <div className="container mx-auto max-w-3xl">
                <article data-testid="about-text" className="mb-12">
                    <h1 className="my-4 text-4xl font-bold">About Wheel in the Sky</h1>
                    <p className="my-4">
                        <em>Wheel in the Sky</em> is a wheel-based solution for randomly choosing from set list of
                        options. It was created by Brian Sokol in order to help randomly choose people to lead meetings
                        at work.
                    </p>
                    <p className="my-4">
                        Wheel configuration is stored entirely in the URL so you can share your wheels with anyone. You
                        don&apos;t need an account. We only use cookies to store local configuration. We do not use
                        cookies to track you across websites, and we do not have ads.
                    </p>
                    <p className="my-4">
                        This app is built with these very cool technologies:
                        <ul className="list-inside list-disc">
                            <li>
                                <Link href="https://reactjs.org">React</Link>
                            </li>
                            <li>
                                <Link href="https://www.heroui.com/">HeroUI</Link>
                            </li>
                            <li>
                                <Link href="https://tailwindcss.com/">Tailwind</Link>
                            </li>
                            <li>
                                <Link href="https://vite.dev/">Vite</Link>
                            </li>
                            <li>
                                <Link href="https://hono.dev/">Hono</Link>
                            </li>
                            <li>
                                <Link href="https://turbo.build/repo/docs">Turborepo</Link>
                            </li>
                        </ul>
                    </p>
                    <p>
                        It&apos;s hosted on <Link href="https://www.cloudflare.com/">Cloudflare</Link>.
                    </p>
                    <p>
                        Source code is available at <FaGithub className="inline-block align-middle" /> GitHub (LINK
                        TBD).
                    </p>
                    <p className="my-4">©{currentYear} Brian Sokol. All rights reserved.</p>
                </article>
                <article data-testid="changelog-text" className="mt-12">
                    {error ? (
                        <p className="my-4">Sorry, I couldn&apos;t load the changelog.</p>
                    ) : (
                        <Markdown
                            components={{
                                h1(props) {
                                    return <h1 className="my-4 text-4xl font-bold">{props.children}</h1>;
                                },
                                h2(props) {
                                    return (
                                        <h2 className="mb-4 mt-12 border-b-1 text-2xl font-bold">{props.children}</h2>
                                    );
                                },
                                h3(props) {
                                    return <h3 className="my-4 text-lg font-bold">{props.children}</h3>;
                                },
                                a(props) {
                                    return (
                                        <Link href={props.href} className="text-[length:inherit]">
                                            {props.children}
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
                    )}
                </article>
            </div>
        </main>
    );
}
