import { FiTrash2 } from "react-icons/fi";
import { IconButton } from "@chakra-ui/react";
import { useRef } from "react";
import AlertDialog from "@/components/ui-components/AlertDialog";
import { useMutation } from "@tanstack/react-query";
import { deletingData, queryClient } from "@/util/http";
import { useSelector } from "react-redux";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import type {
  AlertDialogHandle,
  DeleteUserProps,
  RootState,
} from "@/util/Types";

export default function DeleteUser({ user, onDeleteSuccess }: DeleteUserProps) {
  const modalRef = useRef<AlertDialogHandle | null>(null);
  const authState = useSelector((state: RootState) => state.authState);

  const { mutate, isError, error, isPending } = useMutation({
    mutationFn: deletingData,
    onSuccess: () => {
      modalRef.current?.close();
      onDeleteSuccess(user);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  function deleteConfirmation() {
    modalRef.current?.open();
  }

  function deleteUserHandler() {
    mutate({
      endpoint: `users/${user.id}`,
      signal: undefined,
      headers: {
        Authorization: `Bearer ${authState.token}`,
        "Content-Type": "application/json",
      },
    });
  }

  return (
    <>
      <AlertDialog
        ref={modalRef}
        id={user.id}
        onDelete={deleteUserHandler}
        message={`Are you sure you want to delete ${user.name}'s account with id=${user.id}?`}
      />

      {isError && (
        <LoadingAndError
          isLoading={isPending}
          isError={isError}
          error={error}
        />
      )}

      <IconButton
        size="2xs"
        variant="solid"
        colorPalette="red"
        onClick={deleteConfirmation}
      >
        <FiTrash2 />
      </IconButton>
    </>
  );
}
