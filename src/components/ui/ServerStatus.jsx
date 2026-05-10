import { Badge } from "@chakra-ui/react";
import { memo } from "react";
import { CgShapeCircle } from "react-icons/cg";
import { useSelector } from "react-redux";

function ServerStatus() {
  const status = useSelector((state) => state.serverStatusState.serverStatus);

  return (
    <>
      <Badge
        variant={status === "online" ? "solid" : "surface"}
        colorPalette={status === "online" ? "green" : "red"}
        size="lg"
      >
        <CgShapeCircle color={status === "online" ? "green.500" : "red.500"} />
        {status.toUpperCase()}
      </Badge>
    </>
  );
}

export default memo(ServerStatus);
