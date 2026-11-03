import { Badge, Flex, Spinner } from "@chakra-ui/react";
import { memo } from "react";
import { CgShapeCircle } from "react-icons/cg";
import { useSelector } from "react-redux";
import type { RootState, ServerStatusConfig } from "@/util/Types";

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

function ServerStatus() {
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

export default memo(ServerStatus);