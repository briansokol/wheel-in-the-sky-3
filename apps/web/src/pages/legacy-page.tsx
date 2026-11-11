import { Button } from '@heroui/react';
import { defaultPageColorConfig } from '@repo/shared/constants/colors';
import { encodeConfig } from '@repo/shared/utils/encoding';
import { configFromFormInputs } from '@repo/shared/utils/form-config';
import { useEffect, useState } from 'react';
import { FaCircleChevronUp } from 'react-icons/fa6';
import { useNavigate, useParams } from 'react-router';
import { Encoder } from '@/compatibility/v2/classes/encoder';
import { ConfigV2QueryParams } from '@/compatibility/v2/types';
import { convertConfigV2ToConfigV3 } from '@/compatibility/v2/utils';
import { PageBaseRoute } from '@/constants/routes';
import { useSetDocumentBackgroundColor, useSetDocumentForegroundColor } from '@/hooks/colors';
import { buildConfigHash } from '@/utils/routes';

export default function LegacyPage() {
    useSetDocumentBackgroundColor(defaultPageColorConfig.backgroundColor);
    useSetDocumentForegroundColor(defaultPageColorConfig.foregroundColor);
    const navigate = useNavigate();
    const [newConfig, setNewConfig] = useState<string | null>(null);

    const { oldId } = useParams();

    useEffect(() => {
        if (!oldId) {
            return;
        }

        let cancelled = false;
        const upgrade = async (legacyId: string): Promise<void> => {
            try {
                const decodedConfig = Encoder.urlDecode<ConfigV2QueryParams>(legacyId);
                const encodedConfig = await encodeConfig(
                    configFromFormInputs(convertConfigV2ToConfigV3(decodedConfig))
                );
                if (!cancelled) setNewConfig(encodedConfig);
            } catch (e) {
                console.error(e);
                if (!cancelled) navigate('/404');
            }
        };
        void upgrade(oldId);

        return () => {
            cancelled = true;
        };
    }, [oldId, navigate]);

    return (
        <main>
            <div className="mx-auto flex max-w-(--breakpoint-md) flex-col items-center p-8 sm:p-16 md:p-24">
                <h1 className="text-center text-3xl font-bold md:text-6xl">Upgrade Your Wheel!</h1>
                <p className="mt-8 text-center md:text-lg lg:text-xl">
                    We have updated Wheel in the Sky to a new version! Click the button below to upgrade your wheel and
                    start using the latest features. Be sure to update any bookmarks you have with the new wheel URL.
                </p>
                <Button
                    className="mt-8 shadow-lg"
                    size="lg"
                    variant="primary"
                    isDisabled={!newConfig}
                    onPress={() =>
                        navigate(
                            newConfig ? `${PageBaseRoute.Wheel}${buildConfigHash(newConfig)}` : PageBaseRoute.Wheel
                        )
                    }
                >
                    <FaCircleChevronUp className="text-3xl" />
                    Upgrade Wheel
                </Button>
            </div>
        </main>
    );
}
