import { queryClient, editingData } from "@/util/http";
import { Button } from "@chakra-ui/react";
import type { CellContext } from "@tanstack/react-table";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { IgnoredWord, RootState } from "@/util/Types";

export default function ApproveWord({
  row,
}: CellContext<IgnoredWord, unknown>) {
  const word = row.original;
  const token = useSelector((state: RootState) => state.authState.token);

  const { mutate, isPending } = useMutation({
    mutationFn: editingData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ignored-words"] });
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
    },
  });

  function ignoredWordApprovalHandler(
    ignoredWord: IgnoredWord,
    approved: boolean,
  ) {
    mutate({
      endpoint: `ignored-words/${encodeURIComponent(ignoredWord.word)}`,
      signal: undefined,
      body: { approved },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return word.approved ? (
    "Approved and Processed"
  ) : (
    <Button
      colorPalette="green"
      variant="solid"
      size="2xs"
      disabled={isPending}
      onClick={() => ignoredWordApprovalHandler(word, true)}
    >
      Approve
    </Button>
  );
}
