import { queryClient, editingData } from "@/util/http";
import { Button } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";

export default function ApproveWord({ word }) {

  const authState = useSelector((state) => state.authState);


  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: editingData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ignored-words"] });
    },
  });

  function ignoredWordApprovalHandler(word, payload) {
    mutate({
      endpoint: `ignored-words/${word.word}`,
      body: {
        approved: payload,
      },
      headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
    });
  }
  return (
    <Button
      colorPalette={!word.approved ? "green" : "red"}
      variant="solid"
      size="2xs"
      // disabled={isLoading}
      onClick={() => ignoredWordApprovalHandler(word, !word.approved)}
    >
      {!word.approved ? "Approve" : "Dis-Approve"}
    </Button>
  );
}
