import { Skeleton } from "@chakra-ui/react";
import { Alert, CloseButton } from "@chakra-ui/react";
import { useState } from "react";

export default function LoadingAndError({ isLoading, isError, error }) {
  const [isErrorPresent, setIsErrorPresent] = useState(isError);

  if (isErrorPresent) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Error {error.status}</Alert.Title>
          <Alert.Description>{error.message}</Alert.Description>
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
}
