import { queryClient, sendingData } from "@/util/http";
import { Button, Spinner } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";

export default function GenerateAPIKey() {
  const authState = useSelector((state) => state.authState);
  const { mutate, isPending, isError, error, data } = useMutation({
    mutationFn: sendingData,

    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  function generateKeyHandler() {
    mutate({
      endpoint: "users/generate-api-key",
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
