import {
    Button,
    Card,
    Description,
    FieldError,
    Input,
    Label,
    ListBox,
    Select,
    Skeleton,
    Switch,
    TextArea,
    TextField,
    Tooltip,
} from '@heroui/react';
import { Config } from '@repo/shared/classes/config';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_BASE_COLOR, defaultPageColorConfig } from '@repo/shared/constants/colors';
import { pageColorSelectOptions, wheelColorSelectOptions } from '@repo/shared/constants/config';
import { PageColorType } from '@repo/shared/enums/page-colors';
import { WheelColorType } from '@repo/shared/enums/wheel-colors';
import { ConfigFormInputs } from '@repo/shared/types/config';
import { defaultWheelColorConfig } from '@repo/shared/types/wheel-colors';
import {
    buildWheelColorConfig,
    getPageColorSelectOptionDescription,
    getWheelColorSelectOptionDescription,
} from '@repo/shared/utils/configs';
import { getGlowColors } from '@repo/shared/utils/glow-colors';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { FaAngleDown, FaAngleUp } from 'react-icons/fa6';
import { MdClear, MdOutlineAddCircle, MdSave } from 'react-icons/md';
import { useNavigate, useSearchParams } from 'react-router';
import { ColorPicker } from '@/components/color-picker';
import { WheelGlows } from '@/components/wheel-glows';
import { WheelPreview } from '@/components/wheel-preview';
import { PageBaseRoute } from '@/constants/routes';
import { useSetDocumentBackgroundColor, useSetDocumentForegroundColor } from '@/hooks/colors';
import { useDecodedConfig, useEncodeConfigMutation } from '@/hooks/config';

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
    const [searchParams] = useSearchParams();
    const requestedConfig = searchParams.get('c') ?? 'new';
    const navigate = useNavigate();

    const { data: config, isError, isPending } = useDecodedConfig(requestedConfig);

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

    const { register, handleSubmit, control, setValue } = methods;

    useEffect(() => {
        Object.entries(defaultFormValues).forEach(([key, value]) => {
            setValue(key as keyof ConfigFormInputs, value);
        });
    }, [defaultFormValues, setValue]);

    const {
        title,
        names,
        randomizeOrder,
        showNames,
        baseColor,
        customColors,
        randomizeColor,
        backgroundColor,
        colorSchemeType,
        backgroundColorType,
    } = useWatch({
        control,
        defaultValue: defaultFormValues,
    });

    const deserializedCustomColors = useMemo(() => {
        return JSON.parse(customColors ?? defaultFormValues.customColors);
    }, [customColors, defaultFormValues]);

    const [parsedWheelColorType, wheelColorTypeDesc] = useMemo(() => {
        const parsedType = Number.parseInt(colorSchemeType ?? defaultFormValues.colorSchemeType);
        return [parsedType, getWheelColorSelectOptionDescription(parsedType)];
    }, [colorSchemeType, defaultFormValues]);

    // Only color settings feed the glows; randomizeColor is ignored on purpose so they never flicker.
    const glowColors = useMemo(() => {
        return getGlowColors(
            buildWheelColorConfig(
                parsedWheelColorType,
                baseColor ?? DEFAULT_BASE_COLOR,
                deserializedCustomColors,
                false
            )
        );
    }, [parsedWheelColorType, baseColor, deserializedCustomColors]);

    const [parsedPageColorType, currentPageColorTypeDesc] = useMemo(() => {
        const parsedType = Number.parseInt(backgroundColorType ?? defaultFormValues.backgroundColorType);
        return [parsedType, getPageColorSelectOptionDescription(parsedType)];
    }, [backgroundColorType, defaultFormValues]);

    const { mutateAsync: encodeConfig } = useEncodeConfigMutation();

    const onSubmit: SubmitHandler<ConfigFormInputs> = useCallback(
        async (data) => {
            const { encodedConfig } = await encodeConfig(data);
            if (encodedConfig) {
                navigate(`${PageBaseRoute.Wheel}?c=${encodedConfig}`);
            }
        },
        [encodeConfig, navigate]
    );

    if (isPending) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-foreground border-t-transparent"></div>
                    <p className="text-lg">Loading configuration...</p>
                </div>
            </main>
        );
    }

    if (isError) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <Card className="max-w-md">
                    <Card.Header className="flex flex-col items-center">
                        <h2 className="text-xl font-bold">Unable to load configuration</h2>
                    </Card.Header>
                    <Card.Content className="text-center">
                        <p className="mb-4">The configuration could not be loaded. Please try creating a new wheel.</p>
                    </Card.Content>
                    <Card.Footer className="flex justify-center">
                        <Button variant="tertiary" onPress={() => navigate(PageBaseRoute.Config)}>
                            Create New Wheel
                        </Button>
                    </Card.Footer>
                </Card>
            </main>
        );
    }

    return (
        <main className="flex flex-col items-center px-4 py-8">
            <>
                <WheelGlows colors={glowColors} />
                <div className="fixed z-30 container mx-auto max-w-3xl">
                    <div className="relative space-y-6">
                        <Card className="rounded-3xl glass-surface p-0">
                            <Card.Content className="relative min-h-16 p-3">
                                {previewIsCollapsed ? (
                                    <div className="my-auto size-full text-center">Expand to See Wheel Preview</div>
                                ) : isLoaded ? (
                                    <WheelPreview
                                        names={names ?? defaultFormValues.names}
                                        title={title ?? defaultFormValues.title}
                                        description="Preview of the wheel with the current configuration"
                                        randomizeOrder={randomizeOrder ?? defaultFormValues.randomizeOrder}
                                        wheelColorType={parsedWheelColorType}
                                        baseColor={baseColor ?? defaultFormValues.baseColor}
                                        randomizeColor={randomizeColor ?? defaultFormValues.randomizeColor}
                                        pageColorType={parsedPageColorType}
                                        backgroundColor={backgroundColor ?? defaultFormValues.backgroundColor}
                                        colors={deserializedCustomColors}
                                        showNames={showNames ?? defaultFormValues.showNames}
                                        height="24rem"
                                    />
                                ) : (
                                    <Skeleton data-testid="skeleton" className="h-96 w-full rounded-lg" />
                                )}
                                <Button
                                    isIconOnly
                                    variant="secondary"
                                    className="absolute top-3 right-3 shadow-lg"
                                    aria-label={previewIsCollapsed ? 'Show wheel preview' : 'Hide wheel preview'}
                                    onPress={() => setPreviewIsCollapsed(!previewIsCollapsed)}
                                >
                                    {previewIsCollapsed ? <FaAngleDown /> : <FaAngleUp />}
                                </Button>
                            </Card.Content>
                        </Card>
                    </div>
                </div>
                <div className="relative z-10 container mx-auto max-w-3xl">
                    <div className={`mb-8 ${previewIsCollapsed ? 'h-12' : 'h-96'}`}></div>
                    <div className="glass-form relative space-y-6 rounded-3xl glass-surface p-4 sm:p-6">
                        <h1 className="text-4xl font-bold">Configuration</h1>
                        <FormProvider {...methods}>
                            <form onSubmit={handleSubmit(onSubmit)} className="relative">
                                <input type="hidden" {...register('id')} />
                                <div className="mb-12">
                                    {isLoaded ? (
                                        <Controller
                                            control={control}
                                            name="names"
                                            rules={{ required: true }}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    isRequired
                                                    isInvalid={!!fieldState.error}
                                                    validationBehavior="aria"
                                                    name={field.name}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                >
                                                    <Label>Wheel Segments</Label>
                                                    <TextArea ref={field.ref} placeholder="One per line" />
                                                    <Description>
                                                        The labels that will appear on the wheel segments
                                                    </Description>
                                                    <FieldError>
                                                        You must have at least 1 segment to make a wheel!
                                                    </FieldError>
                                                </TextField>
                                            )}
                                        />
                                    ) : (
                                        <Skeleton data-testid="skeleton" className="h-28 w-full rounded-lg" />
                                    )}
                                </div>
                                <div className="mb-8">
                                    {isLoaded ? (
                                        <Controller
                                            control={control}
                                            name="title"
                                            render={({ field }) => (
                                                <TextField
                                                    name={field.name}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                >
                                                    <Label>Wheel Title</Label>
                                                    <Input placeholder="Enter a title for your wheel" />
                                                </TextField>
                                            )}
                                        />
                                    ) : (
                                        <Skeleton data-testid="skeleton" className="h-14 w-full rounded-lg" />
                                    )}
                                </div>
                                <div className="mt-12 mb-8">
                                    {isLoaded ? (
                                        <Controller
                                            control={control}
                                            name="description"
                                            render={({ field }) => (
                                                <TextField
                                                    name={field.name}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                >
                                                    <Label>Wheel Description</Label>
                                                    <Input placeholder="Describe your wheel" />
                                                    <Description>Helpful when adding bookmarks</Description>
                                                </TextField>
                                            )}
                                        />
                                    ) : (
                                        <Skeleton data-testid="skeleton" className="h-14 w-full rounded-lg" />
                                    )}
                                </div>
                                <div className="mt-8 mb-6">
                                    {isLoaded ? (
                                        <Controller
                                            control={control}
                                            name="randomizeOrder"
                                            render={({ field }) => (
                                                <Switch
                                                    isSelected={field.value}
                                                    onChange={field.onChange}
                                                    name={field.name}
                                                >
                                                    <Switch.Content>
                                                        <Switch.Control className="glass-rim">
                                                            <Switch.Thumb />
                                                        </Switch.Control>
                                                        Randomize Order Every So Often
                                                    </Switch.Content>
                                                </Switch>
                                            )}
                                        />
                                    ) : (
                                        <Skeleton data-testid="skeleton" className="h-12 w-32 rounded-lg" />
                                    )}
                                </div>
                                <div className="mt-6 mb-12">
                                    {isLoaded ? (
                                        <Controller
                                            control={control}
                                            name="showNames"
                                            render={({ field }) => (
                                                <Switch
                                                    isSelected={field.value}
                                                    onChange={field.onChange}
                                                    name={field.name}
                                                >
                                                    <Switch.Content>
                                                        <Switch.Control className="glass-rim">
                                                            <Switch.Thumb />
                                                        </Switch.Control>
                                                        Show Labels on Wheel
                                                    </Switch.Content>
                                                </Switch>
                                            )}
                                        />
                                    ) : (
                                        <Skeleton data-testid="skeleton" className="h-12 w-32 rounded-lg" />
                                    )}
                                </div>
                                <div className="my-12">
                                    {isLoaded ? (
                                        <>
                                            <Controller
                                                control={control}
                                                name="colorSchemeType"
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <Select
                                                        data-testid="wheel-color-select"
                                                        isRequired
                                                        name={field.name}
                                                        value={field.value}
                                                        onChange={(key) => field.onChange(String(key))}
                                                    >
                                                        <Label>Wheel Color Scheme</Label>
                                                        <Select.Trigger>
                                                            <Select.Value>
                                                                {
                                                                    wheelColorSelectOptions.find(
                                                                        (option) => String(option.id) === field.value
                                                                    )?.label
                                                                }
                                                            </Select.Value>
                                                            <Select.Indicator />
                                                        </Select.Trigger>
                                                        <Description>{wheelColorTypeDesc}</Description>
                                                        <Select.Popover>
                                                            <ListBox items={wheelColorSelectOptions}>
                                                                {(option) => (
                                                                    <ListBox.Item
                                                                        id={String(option.id)}
                                                                        textValue={option.label}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <Label>{option.label}</Label>
                                                                            <Description>
                                                                                {option.description}
                                                                            </Description>
                                                                        </div>
                                                                        <ListBox.ItemIndicator />
                                                                    </ListBox.Item>
                                                                )}
                                                            </ListBox>
                                                        </Select.Popover>
                                                    </Select>
                                                )}
                                            />
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
                                                        allowMultiColor={parsedWheelColorType === WheelColorType.Custom}
                                                    />
                                                </div>
                                            )}
                                            {(parsedWheelColorType === WheelColorType.Monochromatic ||
                                                parsedWheelColorType === WheelColorType.Analogous) && (
                                                <div className="mb-3">
                                                    <Controller
                                                        control={control}
                                                        name="randomizeColor"
                                                        render={({ field }) => (
                                                            <Switch
                                                                isSelected={field.value}
                                                                onChange={field.onChange}
                                                                name={field.name}
                                                            >
                                                                <Switch.Content>
                                                                    <Switch.Control className="glass-rim">
                                                                        <Switch.Thumb />
                                                                    </Switch.Control>
                                                                    Randomize Color Order
                                                                </Switch.Content>
                                                            </Switch>
                                                        )}
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
                                        <>
                                            <Controller
                                                control={control}
                                                name="backgroundColorType"
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <Select
                                                        data-testid="app-background-color-select"
                                                        isRequired
                                                        name={field.name}
                                                        value={field.value}
                                                        onChange={(key) => field.onChange(String(key))}
                                                    >
                                                        <Label>Page Background Color</Label>
                                                        <Select.Trigger>
                                                            <Select.Value>
                                                                {
                                                                    pageColorSelectOptions.find(
                                                                        (option) => String(option.id) === field.value
                                                                    )?.label
                                                                }
                                                            </Select.Value>
                                                            <Select.Indicator />
                                                        </Select.Trigger>
                                                        <Description>{currentPageColorTypeDesc}</Description>
                                                        <Select.Popover>
                                                            <ListBox items={pageColorSelectOptions}>
                                                                {(option) => (
                                                                    <ListBox.Item
                                                                        id={String(option.id)}
                                                                        textValue={option.label}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <Label>{option.label}</Label>
                                                                            <Description>
                                                                                {option.description}
                                                                            </Description>
                                                                        </div>
                                                                        <ListBox.ItemIndicator />
                                                                    </ListBox.Item>
                                                                )}
                                                            </ListBox>
                                                        </Select.Popover>
                                                    </Select>
                                                )}
                                            />
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
                                                {requestedConfig !== 'new' && (
                                                    <Tooltip>
                                                        <Button
                                                            className="text-base glass-rim"
                                                            variant="primary"
                                                            type="submit"
                                                        >
                                                            <MdSave className="text-2xl" />
                                                            Update Existing Wheel
                                                        </Button>
                                                        <Tooltip.Content>
                                                            This button will update the existing wheel
                                                        </Tooltip.Content>
                                                    </Tooltip>
                                                )}
                                                <Tooltip>
                                                    <Button
                                                        className="text-base glass-rim"
                                                        variant={requestedConfig === 'new' ? 'primary' : 'secondary'}
                                                        onPress={() => {
                                                            methods.setValue('id', Config.generateId());
                                                            methods.handleSubmit(onSubmit)();
                                                        }}
                                                    >
                                                        <MdOutlineAddCircle className="text-2xl" />
                                                        Create New Wheel
                                                    </Button>
                                                    <Tooltip.Content>
                                                        If you have saved this wheel, this button will create a new
                                                        wheel and not overwrite the saved wheel
                                                    </Tooltip.Content>
                                                </Tooltip>
                                            </div>
                                            <Tooltip>
                                                <Button
                                                    className="text-base glass-rim"
                                                    variant="danger-soft"
                                                    onPress={() => {
                                                        methods.reset();
                                                        navigate(PageBaseRoute.Config);
                                                    }}
                                                >
                                                    <MdClear className="text-2xl" />
                                                    Reset Form
                                                </Button>
                                                <Tooltip.Content>
                                                    This button will reset the form to its default values
                                                </Tooltip.Content>
                                            </Tooltip>
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
        </main>
    );
}
