import { defaultPageColorConfig } from '@repo/shared/constants/colors';
import { useSetDocumentBackgroundColor, useSetDocumentForegroundColor } from '@/hooks/colors';

export default function NotFoundPage() {
    useSetDocumentBackgroundColor(defaultPageColorConfig.backgroundColor);
    useSetDocumentForegroundColor(defaultPageColorConfig.foregroundColor);

    return (
        <main>
            <div className="mx-auto flex max-w-(--breakpoint-md) flex-col items-center p-8 sm:p-16 md:p-24">
                <h1 className="text-center text-3xl font-bold md:text-6xl">Four Hundred Four</h1>
                <p className="mt-8 text-center md:text-lg lg:text-xl">The page you are looking for does not exist!</p>
            </div>
        </main>
    );
}
