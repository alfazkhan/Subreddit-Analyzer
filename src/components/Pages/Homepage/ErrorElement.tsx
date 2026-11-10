import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { AbsoluteCenter, Card, Button } from "@chakra-ui/react";
import { HiHome } from "react-icons/hi";

export default function ErrorElement() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Unknown Error";
  let description: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    description = typeof error.data === "string" ? error.data : String(error.data ?? "");
  } else if (error instanceof Error) {
    title = error.message;
    description = error.stack;
  }

  return (
    <AbsoluteCenter>
      <Card.Root textAlign="center">
        <Card.Body>
          <Card.Title color="red.600">{title}</Card.Title>
          {description && <Card.Description>{description}</Card.Description>}
        </Card.Body>
        <Card.Footer>
          <Button
            variant="subtle"
            colorPalette="orange"
            width="full"
            onClick={() => navigate("/")}
          >
            <HiHome />
            Back to Homepage
          </Button>
        </Card.Footer>
      </Card.Root>
    </AbsoluteCenter>
  );
}
