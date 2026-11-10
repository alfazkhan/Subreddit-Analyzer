import { memo } from "react";
import { Badge, Flex, Heading, Highlight, HStack, Spinner } from "@chakra-ui/react";
import { CgShapeCircle } from "react-icons/cg";
import { useSelector } from "react-redux";
import type { HeaderProps, RootState, ServerStatusConfig } from "@/util/Types";

// ── Header ─────────────────────────────────────────────────────────

export function Header({ text, highlight }: HeaderProps) {
  return (
    <HStack gap={10}>
      <Heading size="5xl">
        <Highlight query={highlight ?? ""} styles={{ color: "orange.600" }}>
          {text}
        </Highlight>
      </Heading>
    </HStack>
  );
}

// ── ServerStatus ───────────────────────────────────────────────────

const config: ServerStatusConfig = {
  checking: {
    colorPalette: "yellow",
    variant: "solid",
    text: "Checking...",
    color: "gray.900",
  },
  online: {
    colorPalette: "green",
    variant: "solid",
    text: "Online",
    color: "green.500",
  },
  offline: {
    colorPalette: "red",
    variant: "solid",
    text: "Offline",
    color: "red.500",
  },
};

function ServerStatusComponent() {
  const status = useSelector(
    (state: RootState) => state.serverStatusState.serverStatus,
  );

  return (
    <Flex alignItems="center" gap={5}>
      <Badge
        variant={config[status].variant}
        colorPalette={config[status].colorPalette}
        size="lg"
      >
        {status === "checking" ? (
          <Spinner color={config[status].color} />
        ) : (
          <CgShapeCircle color={config[status].color} />
        )}
        {config[status].text.toUpperCase()}
      </Badge>
    </Flex>
  );
}

export const ServerStatus = memo(ServerStatusComponent);
