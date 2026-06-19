import { FiTrash2 } from "react-icons/fi";
import { IconButton } from "@chakra-ui/react";
import { useRef } from "react";
import AlertDialog from "@/components/ui-components/AlertDialog";
import { useMutation } from "@tanstack/react-query";
import { deletingData, queryClient } from "@/util/http";
import { useSelector } from "react-redux";
import LoadingAndError from "@/components/ui-components/LoadingAndError";

export default function DeleteUser({ user,onDeleteSuccess }) {
  const modalRef = useRef();
  const authState = useSelector((state) => state.authState);

  const { mutate, isError, error, isPending } = useMutation({
    mutationFn: deletingData,
    onSuccess: () => {
      modalRef.current.close();
      onDeleteSuccess(user)
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  function deleteConfirmation() {
    console.log(user.id);
    modalRef.current.open();
  }

  function deleteUserHandler() {
    // modalRef.current.close();
    // onDeleteSuccess(user)
    // queryClient.invalidateQueries({ queryKey: ["users"] });

    mutate({
      endpoint: `users/${user.id}`,
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
        onDelete={deleteUserHandler}
        message={`Are you sure you want to delete ${user?.name}'s account with id=${user?.id}?`}
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
        onClick={() => deleteConfirmation(user.id, user.name)}
      >
        <FiTrash2 />
      </IconButton>
    </>
  );
}
