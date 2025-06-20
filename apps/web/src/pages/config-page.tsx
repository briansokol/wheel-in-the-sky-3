import { Button, Card, CardBody, Input, Link, Select, SelectItem, Skeleton, Switch, Textarea } from '@heroui/react';
import { Config } from '@repo/shared/classes/config';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_BASE_COLOR, defaultPageColorConfig } from '@repo/shared/constants/colors';
import { pageColorSelectOptions, wheelColorSelectOptions } from '@repo/shared/constants/config';
import { PageColorType } from '@repo/shared/enums/page-colors';
import { WheelColorType } from '@repo/shared/enums/wheel-colors';
import { ConfigFormInputs } from '@repo/shared/types/config';
import { defaultWheelColorConfig } from '@repo/shared/types/wheel-colors';
import { getPageColorSelectOptionDescription, getWheelColorSelectOptionDescription } from '@repo/shared/utils/configs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { FaAngleDown, FaAngleUp } from 'react-icons/fa6';
import { MdClear, MdOutlineAddCircle, MdSave } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router';
import { ColorPicker } from '@/components/color-picker';
import { WheelPreview } from '@/components/wheel-preview';
import { PageBaseRoute } from '@/constants/routes';
import { useSetDocumentBackgroundColor, useSetDocumentForegroundColor } from '@/hooks/colors';
import { useDecodedConfig, useEncodeConfigMutation, useValidConfigCheck } from '@/hooks/config';

function getDefaultFormValues(config: Config | undefined): ConfigFormInputs {
    return {
        id: config?.id ?? '',
        title: config?.title ?? '',
        description: config?.description ?? '',
        names: config?.names.join('\n') ?? '',
        randomizeOrder: config?.randomizeOrder ?? false,
        showNames: config?.showNames ?? true,
        colorSchemeType: `${config?.wheelColorConfig?.wheelColorType ?? defaultWheelColorConfig.wheelColorType}`,
        baseColor: config?.wheelColorConfig?.baseColor ?? DEFAULT_BASE_COLOR,
        customColors: JSON.stringify(config?.wheelColorConfig?.colors ?? []),
        randomizeColor: config?.wheelColorConfig?.randomizeColor ?? false,
        backgroundColorType: `${config?.pageColorConfig?.backgroundColorType ?? defaultPageColorConfig.backgroundColorType}`,
        backgroundColor: config?.pageColorConfig?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
    };
}

export default function ConfigPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: config, isError, isPending } = useDecodedConfig(id);

    useValidConfigCheck(id, isError);

    const defaultFormValues = useMemo(() => {
        return getDefaultFormValues(config);
    }, [config]);

    const isLoaded = useMemo(() => {
        return !isPending && config !== undefined;
    }, [isPending, config]);

    const [previewIsCollapsed, setPreviewIsCollapsed] = useState<boolean>(true);

    useSetDocumentBackgroundColor(defaultPageColorConfig.backgroundColor);
    useSetDocumentForegroundColor(defaultPageColorConfig.foregroundColor);

    const methods = useForm<ConfigFormInputs>({
        defaultValues: defaultFormValues,
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        // formState: { errors },
    } = methods;

    useEffect(() => {
        Object.entries(defaultFormValues).forEach(([key, value]) => {
            setValue(key as keyof ConfigFormInputs, value);
        });
    }, [defaultFormValues, setValue]);

    const title = watch('title');
    const names = watch('names');
    const randomizeOrder = watch('randomizeOrder');
    const showNames = watch('showNames');
    const baseColor = watch('baseColor');
    const customColors = watch('customColors');
    const randomizeColor = watch('randomizeColor');
    const backgroundColor = watch('backgroundColor');
    const colorSchemeType = watch('colorSchemeType');
    const backgroundColorType = watch('backgroundColorType');

    const deserializedCustomColors = useMemo(() => {
        return JSON.parse(customColors);
    }, [customColors]);

    const [parsedWheelColorType, wheelColorTypeDesc] = useMemo(() => {
        const parsedType = Number.parseInt(colorSchemeType);
        return [parsedType, getWheelColorSelectOptionDescription(parsedType)];
    }, [colorSchemeType]);

    const [parsedPageColorType, currentPageColorTypeDesc] = useMemo(() => {
        const parsedType = Number.parseInt(backgroundColorType);
        return [parsedType, getPageColorSelectOptionDescription(parsedType)];
    }, [backgroundColorType]);

    const { mutateAsync: encodeConfig } = useEncodeConfigMutation();

    const onSubmit: SubmitHandler<ConfigFormInputs> = useCallback(
        async (data) => {
            const { encodedConfig } = await encodeConfig(data);
            if (encodedConfig) {
                navigate(`/wheel/v3/${encodedConfig}`);
            }
        },
        [encodeConfig, navigate]
    );

    return (
        <main className="flex flex-col items-center px-4 py-8">
            {!isError && (
                <>
                    <div className="container fixed z-30 mx-auto max-w-3xl">
                        <div className="relative space-y-6">
                            <Card shadow="lg" isBlurred>
                                <CardBody className="relative min-h-16">
                                    {previewIsCollapsed ? (
                                        <div className="my-auto size-full text-center">Expand to See Wheel Preview</div>
                                    ) : isLoaded ? (
                                        <WheelPreview
                                            names={names}
                                            title={title}
                                            description="Preview of the wheel with the current configuration"
                                            randomizeOrder={randomizeOrder}
                                            wheelColorType={parsedWheelColorType}
                                            baseColor={baseColor}
                                            randomizeColor={randomizeColor}
                                            pageColorType={parsedPageColorType}
                                            backgroundColor={backgroundColor}
                                            colors={deserializedCustomColors}
                                            showNames={showNames}
                                            height="24rem"
                                        />
                                    ) : (
                                        <Skeleton data-testid="skeleton" className="h-96 w-full rounded-lg" />
                                    )}
                                    <Button
                                        isIconOnly
                                        variant="shadow"
                                        color="secondary"
                                        className="absolute right-3 top-3"
                                        aria-label={previewIsCollapsed ? 'Show wheel preview' : 'Hide wheel preview'}
                                        onPress={() => setPreviewIsCollapsed(!previewIsCollapsed)}
                                    >
                                        {previewIsCollapsed ? <FaAngleDown /> : <FaAngleUp />}
                                    </Button>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                    <div className="container mx-auto max-w-3xl">
                        <div className={`mb-8 ${previewIsCollapsed ? 'h-12' : 'h-96'}`}></div>
                        <div className="relative space-y-6">
                            <h1 className="text-4xl font-bold">Configuration</h1>
                            <FormProvider {...methods}>
                                <form onSubmit={handleSubmit(onSubmit)} className="relative">
                                    <input type="hidden" {...register('id')} />
                                    <div className="mb-12">
                                        {isLoaded ? (
                                            <Textarea
                                                {...register('names', { required: true })}
                                                label="Wheel Segments"
                                                labelPlacement="outside"
                                                placeholder="One per line"
                                                isRequired
                                                description="The labels that will appear on the wheel segments"
                                                errorMessage="You must have at least 1 segment to make a wheel!"
                                            />
                                        ) : (
                                            <Skeleton data-testid="skeleton" className="h-28 w-full rounded-lg" />
                                        )}
                                    </div>
                                    <div className="mb-8">
                                        {isLoaded ? (
                                            <Input
                                                {...register('title')}
                                                label="Wheel Title"
                                                labelPlacement="outside"
                                                placeholder="Enter a title for your wheel"
                                            />
                                        ) : (
                                            <Skeleton data-testid="skeleton" className="h-14 w-full rounded-lg" />
                                        )}
                                    </div>
                                    <div className="mb-8 mt-12">
                                        {isLoaded ? (
                                            <Input
                                                {...register('description')}
                                                label="Wheel Description"
                                                labelPlacement="outside"
                                                placeholder="Describe your wheel"
                                                description="Helpful when adding bookmarks"
                                            />
                                        ) : (
                                            <Skeleton data-testid="skeleton" className="h-14 w-full rounded-lg" />
                                        )}
                                    </div>
                                    <div className="mb-6 mt-8">
                                        {isLoaded ? (
                                            <Switch {...register('randomizeOrder')}>
                                                Randomize Order Every So Often
                                            </Switch>
                                        ) : (
                                            <Skeleton data-testid="skeleton" className="h-12 w-32 rounded-lg" />
                                        )}
                                    </div>
                                    <div className="mb-12 mt-6">
                                        {isLoaded ? (
                                            <Switch {...register('showNames')}>Show Labels on Wheel</Switch>
                                        ) : (
                                            <Skeleton data-testid="skeleton" className="h-12 w-32 rounded-lg" />
                                        )}
                                    </div>
                                    <div className="my-12">
                                        {isLoaded ? (
                                            <>
                                                <Select
                                                    {...register('colorSchemeType', { required: true })}
                                                    data-testid="wheel-color-select"
                                                    items={wheelColorSelectOptions}
                                                    label="Wheel Color Scheme"
                                                    labelPlacement="outside"
                                                    disallowEmptySelection
                                                    isRequired
                                                    description={wheelColorTypeDesc}
                                                    defaultSelectedKeys={[
                                                        `${config?.wheelColorConfig?.wheelColorType ?? defaultWheelColorConfig.wheelColorType}`,
                                                    ]}
                                                    popoverProps={{ shouldBlockScroll: true }}
                                                    renderValue={(items) => {
                                                        return items.map((item) => (
                                                            <div key={item.key} className="my-2 flex flex-col">
                                                                <span className="text-medium">{item.data?.label}</span>
                                                            </div>
                                                        ));
                                                    }}
                                                >
                                                    {(option) => (
                                                        <SelectItem key={option.id} textValue={`${option.id}`}>
                                                            <div className="flex flex-col">
                                                                <span className="text-medium">{option.label}</span>
                                                                <span className="text-small text-default-500">
                                                                    {option.description}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    )}
                                                </Select>
                                                {parsedWheelColorType !== WheelColorType.Random && (
                                                    <div className="mb-3">
                                                        <div>
                                                            {parsedWheelColorType === WheelColorType.Custom
                                                                ? 'Choose a color'
                                                                : 'Base Color'}
                                                        </div>
                                                        <ColorPicker
                                                            singleColorName="baseColor"
                                                            multiColorName="customColors"
                                                            allowMultiColor={
                                                                parsedWheelColorType === WheelColorType.Custom
                                                            }
                                                        />
                                                    </div>
                                                )}
                                                {(parsedWheelColorType === WheelColorType.Monochromatic ||
                                                    parsedWheelColorType === WheelColorType.Analogous) && (
                                                    <div className="mb-3">
                                                        <Switch {...register('randomizeColor')}>
                                                            Randomize Color Order
                                                        </Switch>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <Skeleton data-testid="skeleton" className="h-14 w-full rounded-lg" />
                                        )}
                                    </div>
                                    <div className="my-12">
                                        {isLoaded ? (
                                            <>
                                                <Select
                                                    {...register('backgroundColorType', { required: true })}
                                                    data-testid="app-background-color-select"
                                                    items={pageColorSelectOptions}
                                                    label="Page Background Color"
                                                    labelPlacement="outside"
                                                    disallowEmptySelection
                                                    isRequired
                                                    description={currentPageColorTypeDesc}
                                                    defaultSelectedKeys={[
                                                        `${config?.pageColorConfig?.backgroundColorType ?? defaultPageColorConfig.backgroundColorType}`,
                                                    ]}
                                                    popoverProps={{ shouldBlockScroll: true }}
                                                    renderValue={(items) => {
                                                        return items.map((item) => (
                                                            <div key={item.key} className="my-2 flex flex-col">
                                                                <span className="text-medium">{item.data?.label}</span>
                                                            </div>
                                                        ));
                                                    }}
                                                >
                                                    {(option) => (
                                                        <SelectItem key={option.id} textValue={`${option.id}`}>
                                                            <div className="flex flex-col">
                                                                <span className="text-medium">{option.label}</span>
                                                                <span className="text-small text-default-500">
                                                                    {option.description}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    )}
                                                </Select>
                                                {parsedPageColorType === PageColorType.Single && (
                                                    <div className="mb-3">
                                                        <div>Background Color</div>
                                                        <ColorPicker
                                                            singleColorName="backgroundColor"
                                                            allowMultiColor={false}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <Skeleton data-testid="skeleton" className="h-14 w-full rounded-lg" />
                                        )}
                                    </div>
                                    <div className="my-12">
                                        {isLoaded ? (
                                            <div className="flex justify-between">
                                                <div className="flex gap-4">
                                                    {id !== 'new' && (
                                                        <Button
                                                            className="text-base"
                                                            startContent={<MdSave className="text-2xl" />}
                                                            color="primary"
                                                            type="submit"
                                                            title="This button will update the existing wheel"
                                                        >
                                                            Update Existing Wheel
                                                        </Button>
                                                    )}
                                                    <Button
                                                        className="text-base"
                                                        startContent={<MdOutlineAddCircle className="text-2xl" />}
                                                        color={id === 'new' ? 'primary' : 'secondary'}
                                                        variant={id === 'new' ? 'solid' : 'flat'}
                                                        title="If you have saved this wheel, this button will create a new wheel and not overwrite the saved wheel"
                                                        onPress={() => {
                                                            methods.setValue('id', Config.generateId());
                                                            methods.handleSubmit(onSubmit)();
                                                        }}
                                                    >
                                                        Create New Wheel
                                                    </Button>
                                                </div>
                                                <Button
                                                    as={Link}
                                                    href={`${PageBaseRoute.ConfigV3}/new`}
                                                    className="text-base"
                                                    startContent={<MdClear className="text-2xl" />}
                                                    color="danger"
                                                    variant="flat"
                                                    onPress={() => {
                                                        methods.reset();
                                                    }}
                                                    title="This button will reset the form to its default values"
                                                >
                                                    Reset Form
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between">
                                                <div className="flex gap-4">
                                                    <Skeleton data-testid="skeleton" className="h-14 w-24 rounded-lg" />
                                                    <Skeleton data-testid="skeleton" className="h-14 w-24 rounded-lg" />
                                                </div>
                                                <Skeleton data-testid="skeleton" className="h-14 w-24 rounded-lg" />
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </FormProvider>
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}
