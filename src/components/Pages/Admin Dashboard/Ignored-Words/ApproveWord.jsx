import { queryClient, editingData } from "@/util/http";
import { Button } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";

export default function ApproveWord({row }) {
  const word = row?.original


  const authState = useSelector((state) => state.authState);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: editingData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ignored-words"] });
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
    },
  });

  function ignoredWordApprovalHandler(word, payload) {
    mutate({
      endpoint: `ignored-words/${encodeURIComponent(word.word)}`,
      body: {
        approved: Boolean(payload),
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
      disabled={isPending}
      onClick={() => ignoredWordApprovalHandler(word, !word.approved)}
    >
      {!word.approved ? "Approve" : "Dis-Approve"}
    </Button>
  );
}
