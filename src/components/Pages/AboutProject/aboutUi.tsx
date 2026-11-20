import type { ReactNode } from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import type { BoxProps } from "@chakra-ui/react";
import type { HypothesisVerdictType } from "@/util/Types";

/*
 * Shared building blocks for the About page.
 *
 * Colours are explicit tokens (gray.300, whiteAlpha.100, ...) rather than
 * Chakra colorPalette recipes: the app forces a dark look but the provider
 * follows the OS colour mode, so palette-based Badges render light-theme
 * colours on light-mode machines.
 */

export const C = {
  heading: "gray.50",
  text: "gray.300",
  muted: "gray.500",
  line: "whiteAlpha.200",
  surface: "whiteAlpha.50",
  accent: "orange.400",
} as const;

interface SectionProps {
  id: string;
  title: string;
  /** Optional line under the heading. */
  lede?: ReactNode;
  /** Right-aligned control next to the heading (e.g. search box). */
  aside?: ReactNode;
  children: ReactNode;
}

export function Section({ id, title, lede, aside, children }: SectionProps) {
  return (
    <Box as="section" id={id} scrollMarginTop="88px" aria-labelledby={`${id}-heading`}>
      <Box
        display="flex"
        flexWrap="wrap"
        alignItems="baseline"
        justifyContent="space-between"
        gap={3}
        mb={lede ? 2 : 5}
      >
        <Heading
          as="h2"
          id={`${id}-heading`}
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="semibold"
          letterSpacing="-0.02em"
          color={C.heading}
        >
          {title}
        </Heading>
        {aside}
      </Box>
      {lede && (
        <Text color="gray.400" fontSize="lg" lineHeight="1.6" mb={6} maxW="65ch">
          {lede}
        </Text>
      )}
      {children}
    </Box>
  );
}

export function SubHeading({ children, ...rest }: { children: ReactNode } & BoxProps) {
  return (
    <Heading as="h3" fontSize="lg" fontWeight="semibold" color={C.heading} mb={3} {...rest}>
      {children}
    </Heading>
  );
}

export function P({ children, ...rest }: { children: ReactNode } & BoxProps) {
  return (
    <Text color={C.text} fontSize="md" lineHeight="1.75" maxW="68ch" {...rest}>
      {children}
    </Text>
  );
}

type Tone = "green" | "amber" | "gray" | "orange";

const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  green: { bg: "rgba(34,197,94,0.12)", fg: "#86efac", border: "rgba(34,197,94,0.35)" },
  amber: { bg: "rgba(234,179,8,0.12)", fg: "#fde047", border: "rgba(234,179,8,0.35)" },
  gray: { bg: "rgba(255,255,255,0.06)", fg: "#d4d4d8", border: "rgba(255,255,255,0.16)" },
  orange: { bg: "rgba(249,115,22,0.12)", fg: "#fdba74", border: "rgba(249,115,22,0.35)" },
};

export function Pill({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      gap={1}
      px={2}
      py="1px"
      fontSize="xs"
      fontWeight="medium"
      lineHeight="1.6"
      whiteSpace="nowrap"
      borderRadius="full"
      borderWidth="1px"
      style={{ background: t.bg, color: t.fg, borderColor: t.border }}
    >
      {children}
    </Box>
  );
}

const VERDICT_TONE: Record<HypothesisVerdictType, Tone> = {
  Supported: "green",
  "Supported, small effect": "amber",
  Inconclusive: "gray",
};

export function VerdictPill({ verdict }: { verdict: HypothesisVerdictType }) {
  return <Pill tone={VERDICT_TONE[verdict]}>{verdict}</Pill>;
}

/** Bulleted list with a bold lead-in per item. */
export function PointList({ items }: { items: { title: string; text: string }[] }) {
  return (
    <Box as="ul" listStyleType="none" m={0} p={0} display="grid" gap={3}>
      {items.map((item) => (
        <Box
          as="li"
          key={item.title}
          position="relative"
          pl={5}
          color={C.text}
          fontSize="md"
          lineHeight="1.7"
          maxW="68ch"
          _before={{
            content: '""',
            position: "absolute",
            left: 0,
            top: "0.7em",
            w: "6px",
            h: "6px",
            borderRadius: "full",
            bg: "gray.600",
          }}
        >
          <Text as="span" fontWeight="semibold" color={C.heading}>
            {item.title}
          </Text>{" "}
          {item.text}
        </Box>
      ))}
    </Box>
  );
}
