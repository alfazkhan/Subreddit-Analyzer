import { queryClient, sendingData } from "@/util/http";
import { Button, Spinner } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { RootState } from "@/util/Types";

export default function GenerateAPIKey() {
  const authState = useSelector((state: RootState) => state.authState);
  const { mutate, isPending } = useMutation({
    mutationFn: sendingData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  function generateKeyHandler() {
    mutate({
      endpoint: "users/generate-api-key",
      signal: undefined,
      body: null,
      headers: {
        Authorization: `Bearer ${authState.token}`,
        "Content-Type": "application/json",
      },
    });
  }

  return (
    <Button
      size="2xs"
      variant="solid"
      colorPalette={!isPending ? "green" : "gray"}
      onClick={generateKeyHandler}
      disabled={isPending}
    >
      {isPending && <Spinner />}
      Generate API Key
    </Button>
  );
}
