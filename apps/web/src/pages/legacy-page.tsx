import { Button, Link } from '@heroui/react';
import { defaultPageColorConfig } from '@repo/shared/constants/colors';
import { useEffect, useState } from 'react';
import { FaCircleChevronUp } from 'react-icons/fa6';
import { useNavigate, useParams } from 'react-router';
import { Encoder } from '@/compatibility/v2/classes/encoder';
import { ConfigV2QueryParams } from '@/compatibility/v2/types';
import { convertConfigV2ToConfigV3 } from '@/compatibility/v2/utils';
import { useSetDocumentBackgroundColor, useSetDocumentForegroundColor } from '@/hooks/colors';
import { useEncodeConfigMutation } from '@/hooks/config';

export default function LegacyPage() {
    useSetDocumentBackgroundColor(defaultPageColorConfig.backgroundColor);
    useSetDocumentForegroundColor(defaultPageColorConfig.foregroundColor);
    const navigate = useNavigate();
    const { mutateAsync: encodeConfig } = useEncodeConfigMutation();
    const [newConfig, setNewConfig] = useState<string | null>(null);

    const { oldId } = useParams();

    useEffect(() => {
        if (oldId) {
            let decodedConfig: ConfigV2QueryParams | null = null;
            try {
                decodedConfig = Encoder.urlDecode<ConfigV2QueryParams>(oldId);
            } catch (e) {
                console.error(e);
                navigate('/404');
            }
            if (decodedConfig) {
                const config = convertConfigV2ToConfigV3(decodedConfig);
                encodeConfig(config).then((result) => {
                    setNewConfig(result.encodedConfig);
                });
            }
        }
    }, [oldId, navigate, encodeConfig]);

    return (
        <main>
            <div className="mx-auto flex max-w-(--breakpoint-md) flex-col items-center p-8 sm:p-16 md:p-24">
                <h1 className="text-center text-3xl font-bold md:text-6xl">Upgrade Your Wheel!</h1>
                <p className="mt-8 text-center md:text-lg lg:text-xl">
                    We have updated Wheel in the Sky to a new version! Click the button below to upgrade your wheel and
                    start using the latest features. Be sure to update any bookmarks you have with the new wheel URL.
                </p>
                <Button
                    as={Link}
                    href={`/wheel/v3/${newConfig}`}
                    className="mt-8"
                    size="lg"
                    color="primary"
                    variant="shadow"
                    disabled={!newConfig}
                    startContent={<FaCircleChevronUp className="text-3xl" />}
                >
                    Upgrade Wheel
                </Button>
            </div>
        </main>
    );
}
