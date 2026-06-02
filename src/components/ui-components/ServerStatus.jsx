import { Badge, Spinner } from "@chakra-ui/react";
import { memo } from "react";
import { CgShapeCircle } from "react-icons/cg";
import { useSelector } from "react-redux";


const config = {
  checking: {
    colorPalette: "yellow",
    variant: "solid",
    text: "Checking...",
    color: "gray.900"
  },
  online: {
    colorPalette: "green",
    variant: "solid",
    text: "Online",
    color: "green.500"
  },
  offline: {
    colorPalette: "red",
    variant: "solid",
    text: "Offline",
    color: "red.500"
  },
}

function ServerStatus() {
  const status = useSelector((state) => state.serverStatusState.serverStatus);

  return (
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
  );
}

export default memo(ServerStatus);
