'use client'

import {
  ChakraProvider,
  ClientOnly,
  IconButton,
  Portal,
  Skeleton,
  Span,
  Spinner,
  Stack,
  Toast,
  Toaster as ChakraToaster,
  Tooltip as ChakraTooltip,
  createToaster,
  defaultSystem,
} from '@chakra-ui/react'
import { ThemeProvider, useTheme } from 'next-themes'
import * as React from 'react'
import { LuMoon, LuSun } from 'react-icons/lu'
import type {
  ChakraUIProviderProps,
  ColorModeButtonProps,
  ColorModeContextValue,
  ToasterProps,
  TooltipProps,
} from '@/util/Types'

// ── Color Mode ─────────────────────────────────────────────────────

export function ColorModeProvider(
  props: React.ComponentProps<typeof ThemeProvider>,
) {
  return (
    <ThemeProvider attribute='class' disableTransitionOnChange {...props} />
  )
}

export function useColorMode(): ColorModeContextValue {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()
  const colorMode = forcedTheme || resolvedTheme
  const toggleColorMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }
  return {
    colorMode: colorMode,
    setColorMode: setTheme,
    toggleColorMode,
  }
}

export function useColorModeValue<T>(light: T, dark: T): T {
  const { colorMode } = useColorMode()
  return colorMode === 'dark' ? dark : light
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode()
  return colorMode === 'dark' ? <LuMoon /> : <LuSun />
}

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(
  function ColorModeButton(props, ref) {
    const { toggleColorMode } = useColorMode()
    return (
      <ClientOnly fallback={<Skeleton boxSize='9' />}>
        <IconButton
          onClick={toggleColorMode}
          variant='ghost'
          aria-label='Toggle color mode'
          size='sm'
          ref={ref}
          {...props}
          css={{
            _icon: {
              width: '5',
              height: '5',
            },
          }}
        >
          <ColorModeIcon />
        </IconButton>
      </ClientOnly>
    )
  },
)

export const LightMode = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(
  function LightMode(props, ref) {
    return (
      <Span
        color='fg'
        display='contents'
        className='chakra-theme light'
        colorPalette='gray'
        colorScheme='light'
        ref={ref}
        {...props}
      />
    )
  },
)

export const DarkMode = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(
  function DarkMode(props, ref) {
    return (
      <Span
        color='fg'
        display='contents'
        className='chakra-theme dark'
        colorPalette='gray'
        colorScheme='dark'
        ref={ref}
        {...props}
      />
    )
  },
)

// ── Provider ───────────────────────────────────────────────────────

export function ChakraUIProvider({ children }: ChakraUIProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider>
        {children}
      </ColorModeProvider>
    </ChakraProvider>
  )
}

// ── Toaster ────────────────────────────────────────────────────────

export const toaster = createToaster({
  placement: 'bottom-end',
  pauseOnPageIdle: true,
})

export const Toaster = ({}: ToasterProps) => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast) => (
          <Toast.Root width={{ md: 'sm' }}>
            {toast.type === 'loading' ? (
              <Spinner size='sm' color='blue.solid' />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap='1' flex='1' maxWidth='100%'>
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}

// ── Tooltip ────────────────────────────────────────────────────────

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  function Tooltip(props, ref) {
    const {
      showArrow,
      children,
      disabled,
      portalled = true,
      content,
      contentProps,
      portalRef,
      ...rest
    } = props

    if (disabled) return children as React.ReactElement

    return (
      <ChakraTooltip.Root {...rest}>
        <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
        <Portal disabled={!portalled} container={portalRef}>
          <ChakraTooltip.Positioner>
            <ChakraTooltip.Content ref={ref} {...contentProps}>
              {showArrow && (
                <ChakraTooltip.Arrow>
                  <ChakraTooltip.ArrowTip />
                </ChakraTooltip.Arrow>
              )}
              {content}
            </ChakraTooltip.Content>
          </ChakraTooltip.Positioner>
        </Portal>
      </ChakraTooltip.Root>
    )
  },
)
