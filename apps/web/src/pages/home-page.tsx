import { Button, Divider, Link } from '@heroui/react';

export default function HomePage() {
    return (
        <main>
            <div className="mx-auto flex max-w-screen-md flex-col items-center p-8 sm:p-16 md:p-24">
                <h1 className="text-center text-3xl font-bold md:text-6xl">Spin Your Destiny</h1>
                <p className="mt-8 text-center md:text-lg lg:text-xl">
                    Wheel in the Sky is the ultimate app for making decisions, hosting contests, or just having fun. Add
                    names, spin the wheel, and let fate decide the winner.
                </p>
                <p className="mt-4 text-center md:text-lg lg:text-xl">
                    Whether you&apos;re planning a raffle, need a creative way to choose teams, or want to settle
                    debates, Wheel in the Sky makes it effortless and entertaining.
                </p>
                <Button as={Link} href="/config/v3/new" className="mt-8" size="lg" color="primary" variant="shadow">
                    Make a Wheel
                </Button>
            </div>
            <div className="mx-auto flex max-w-5xl flex-col justify-between sm:flex-row">
                <div className="mx-6 mt-8 sm:mx-10 md:mx-12">
                    <h2 className="mb-2 text-lg font-bold text-primary md:text-xl">Create</h2>
                    <Divider />
                    <p>
                        Making a new wheel is as easy as adding names to a list. Make a new wheel, add the names (one
                        per line), and save your wheel. Done.
                    </p>
                </div>
                <div className="mx-6 mt-8 sm:mx-10 md:mx-12">
                    <h2 className="mb-2 text-lg font-bold text-primary md:text-xl">Customize</h2>
                    <Divider />
                    <p>
                        You can customize one of our pre-made color schemes, or make your own from scratch. You can also
                        customize the page background.
                    </p>
                </div>
                <div className="mx-6 mt-8 sm:mx-10 md:mx-12">
                    <h2 className="mb-2 text-lg font-bold text-primary md:text-xl">Share</h2>
                    <Divider />
                    <p>
                        Your wheel&apos;s configuration is stored entirely in the URL. Just copy your wheel URL and send
                        it to anyone. Add a title and a description to make bookmarking easier.
                    </p>
                </div>
            </div>
        </main>
    );
}
