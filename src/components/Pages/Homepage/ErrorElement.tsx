import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { AbsoluteCenter, Card, Button } from "@chakra-ui/react";
import { HiHome } from "react-icons/hi";

export default function ErrorElement() {
  let error = useRouteError();
  let navigate = useNavigate();
  if (isRouteErrorResponse(error)) {
    return (
      <AbsoluteCenter>
        <Card.Root textAlign="center">
          <Card.Body>
            <Card.Title color="red.600">
              {error.status} {error.statusText}
            </Card.Title>
            <Card.Description>{error.data}</Card.Description>
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
  } else if (error instanceof Error) {
    return (
      <AbsoluteCenter>
        <Card.Root textAlign="center">
          <Card.Body>
            <Card.Title color="red.600">{error.message}</Card.Title>
            <Card.Description>{error.stack}</Card.Description>
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
  } else {
    return (
      <AbsoluteCenter>
        <Card.Root textAlign="center">
          <Card.Body>
            <Card.Title color="red.600">Unknown Error</Card.Title>
            <Button
              variant="subtle"
              colorPalette="orange"
              width="full"
              onClick={() => navigate("/")}
            >
              <HiHome />
              Back to Homepage
            </Button>
          </Card.Body>
        </Card.Root>
      </AbsoluteCenter>
    );
  }
}
