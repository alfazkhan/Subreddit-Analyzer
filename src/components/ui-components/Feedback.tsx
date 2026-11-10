import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Alert,
  Badge,
  Center,
  CloseButton,
  HStack,
  Progress,
  Skeleton,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { LoadingAndErrorProps, UiProgressBarProps } from "@/util/Types";

// ── LoadingAndError ────────────────────────────────────────────────

export function LoadingAndError({ isLoading, isError, error }: LoadingAndErrorProps) {
  const [isErrorPresent, setIsErrorPresent] = useState(isError);

  if (isErrorPresent) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Error {error?.status}</Alert.Title>
          <Alert.Description>{error?.message}</Alert.Description>
        </Alert.Content>
        <CloseButton
          pos="relative"
          top="-2"
          insetEnd="-2"
          onClick={() => setIsErrorPresent(false)}
        />
      </Alert.Root>
    );
  } else if (isLoading) {
    return (
      <Skeleton
        asChild={false}
        variant="shine"
        height={100}
        css={{
          "--start-color": "colors.gray.800",
          "--end-color": "colors.gray.900",
        }}
      />
    );
  }
  return null;
}

// ── CenteredSpinner & QueryStateView ───────────────────────────────

export interface CenteredSpinnerProps {
  height?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  borderWidth?: string;
  animationDuration?: string;
}

/**
 * Centered Chakra Spinner used across loading containers and backdrop overlays.
 */
export function CenteredSpinner({
  height = "full",
  size = "xl",
  color = "orange.500",
  borderWidth,
  animationDuration,
}: CenteredSpinnerProps) {
  return (
    <Center height={height}>
      <Spinner
        size={size}
        color={color}
        borderWidth={borderWidth}
        animationDuration={animationDuration}
      />
    </Center>
  );
}

export interface QueryStateViewProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: { message?: string } | null;
  errorPrefix?: string;
  loadingText?: string;
  progress?: number;
  isEmpty?: boolean;
  emptyText?: string;
  height?: string;
  minH?: string;
  spinnerSize?: "xs" | "sm" | "md" | "lg" | "xl";
  children: ReactNode;
}

/**
 * Renders standardized centered loading, download-progress, error, or empty states
 * before displaying the wrapped query content.
 */
export function QueryStateView({
  isLoading = false,
  isError = false,
  error,
  errorPrefix = "Error loading data",
  loadingText,
  progress,
  isEmpty = false,
  emptyText = "No data available.",
  height = "100%",
  minH,
  spinnerSize = "xl",
  children,
}: QueryStateViewProps) {
  if (isLoading) {
    return (
      <Center height={height} minH={minH} width="full">
        <VStack gap={2}>
          <Spinner color="orange.500" size={spinnerSize} />
          {progress !== undefined && (
            <Progress.Root
              value={progress}
              width="min(100%, 360px)"
              colorPalette="orange"
              size="sm"
            >
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
          )}
          {loadingText && (
            <Text fontSize={progress !== undefined ? "sm" : "xs"} color="gray.400">
              {progress !== undefined ? `${loadingText} ${progress}%` : loadingText}
            </Text>
          )}
        </VStack>
      </Center>
    );
  }

  if (isError) {
    return (
      <Center height={height} minH={minH} width="full">
        <Text color="red.400" fontSize="sm">
          {errorPrefix}: {error?.message || "Internal Server Error"}
        </Text>
      </Center>
    );
  }

  if (isEmpty) {
    return (
      <Center height={height} minH={minH} width="full">
        <Text color="gray.500" fontSize="sm">
          {emptyText}
        </Text>
      </Center>
    );
  }

  return <>{children}</>;
}

// ── ProgressBar ────────────────────────────────────────────────────

export function ProgressBar({
  value,
  processingStatus,
  indeterminateWhenZero = false,
  inline = false,
}: UiProgressBarProps) {
  const effectiveValue = indeterminateWhenZero && value <= 0 ? null : value;

  return (
    <Progress.Root
      colorPalette="orange"
      animated={indeterminateWhenZero ? true : value !== 100}
      striped={indeterminateWhenZero ? value > 0 && value < 100 : value !== 100}
      variant="subtle"
      value={effectiveValue}
      size="lg"
      w={"100%"}
    >
      {!inline && (
        <Progress.Label marginBottom="2">{processingStatus}</Progress.Label>
      )}
      <HStack gap="5">
        {inline && <Progress.Label>{processingStatus}</Progress.Label>}
        <Progress.Track flex="1">
          <Progress.Range />
        </Progress.Track>
        <Progress.ValueText>{value}%</Progress.ValueText>
      </HStack>
    </Progress.Root>
  );
}

// ── PortalAlert ────────────────────────────────────────────────────

export interface PortalAlertProps {
  open: boolean;
  status: "info" | "warning" | "success" | "error" | "neutral";
  title: string;
  description: string;
  onClose: () => void;
  portalTargetId?: string;
  my?: string | number;
}

/**
 * Dismissible Chakra Alert that can render either inline or into a DOM portal container.
 */
export function PortalAlert({
  open,
  status,
  title,
  description,
  onClose,
  portalTargetId = "success-message",
  my,
}: PortalAlertProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    if (!portalTargetId || typeof document === "undefined") {
      setPortalContainer(null);
      return;
    }
    setPortalContainer(document.getElementById(portalTargetId));
  }, [portalTargetId, open]);

  if (!open) return null;

  const alertElement = (
    <Alert.Root status={status} variant="solid" my={my}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{description}</Alert.Description>
      </Alert.Content>
      <CloseButton
        pos="relative"
        top="-2"
        insetEnd="-2"
        onClick={onClose}
      />
    </Alert.Root>
  );

  if (!portalTargetId) {
    return alertElement;
  }

  return portalContainer ? createPortal(alertElement, portalContainer) : null;
}

// ── StatusBadge ────────────────────────────────────────────────────

export interface StatusBadgeProps {
  active: boolean;
  trueLabel: string;
  falseLabel: string;
  trueColorPalette?: string;
  falseColorPalette?: string;
  variant?: "solid" | "subtle" | "outline" | "surface" | "plain";
}

/**
 * Renders a boolean state badge with configurable labels and color palettes.
 */
export function StatusBadge({
  active,
  trueLabel,
  falseLabel,
  trueColorPalette = "green",
  falseColorPalette = "gray",
  variant = "solid",
}: StatusBadgeProps) {
  return (
    <Badge
      variant={variant}
      colorPalette={active ? trueColorPalette : falseColorPalette}
    >
      {active ? trueLabel : falseLabel}
    </Badge>
  );
}
