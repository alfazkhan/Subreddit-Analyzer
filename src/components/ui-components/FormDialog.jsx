import { Button, Dialog, Portal, IconButton, Text } from "@chakra-ui/react";
import { useState } from "react";
import LoadingAndError from "./LoadingAndError";
import { useMutation } from "@tanstack/react-query";
import { editingData, queryClient, sendingData } from "@/util/http";
import { useSelector } from "react-redux";
import { FiEdit } from "react-icons/fi";

export default function FormDialog({
  title,
  triggerText,
  initialValues,
  children,
  onFormSuccess,
  mode,
}) {
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState(initialValues);

  const authState = useSelector((state) => state.authState);

  const { mutate, isError, error, isPending } = useMutation({
    mutationFn: mode === "new" ? sendingData : editingData,
    onSuccess: () => {
      setOpen(false);
      onFormSuccess();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleInputChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewUserSubmit = async (e) => {
    e.preventDefault();
    mutate({
      endpoint: "users/create",
      headers: {
        Authorization: `Bearer ${authState.token}`,
        "Content-Type": "application/json",
      },
      body: formValues,
    });
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    const bodyValues = {
      email: formValues.email,
      password: formValues.password,
      name: formValues.name,
      role: formValues.role,
      api_calls_count: formValues.api_calls_count,
      api_calls_limit: formValues.api_calls_limit,
    };

    console.log(bodyValues);

    mutate({
      endpoint: `users/${formValues.id}`,
      headers: {
        Authorization: `Bearer ${authState.token}`,
        "Content-Type": "application/json",
      },
      body: bodyValues,
    });
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Dialog.Trigger asChild>
          {mode === "new" ? (
            <Button size="sm" color="white" fontWeight="bolder" bg="green.600">
              {triggerText}
            </Button>
          ) : (
            mode === "edit" && (
              <IconButton size="2xs" variant="solid" colorPalette="blue">
                <FiEdit />
              </IconButton>
            )
          )}
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              color="black"
              borderColor="whiteAlpha.200"
              as="form"
              onSubmit={
                mode === "new" ? handleNewUserSubmit : handleEditUserSubmit
              }
            >
              <Dialog.Header>
                <Dialog.Title color="orange.500" fontWeight="bolder">
                  {title}
                </Dialog.Title>
              </Dialog.Header>
              {isError && (
                <LoadingAndError
                  isLoading={isPending}
                  isError={isError}
                  error={error}
                />
              )}
              <Dialog.Body display="flex" flexDirection="column" gap="4">
                {children({ values: formValues, onChange: handleInputChange })}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button
                    variant="outline"
                    bgColor="red.600"
                    color="white"
                    size="sm"
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  type="submit"
                  size="sm"
                  bg="green.600"
                  color="white"
                  fontWeight="bolder"
                  loading={isPending}
                  // onClick={handleFormSubmit}
                >
                  Save Changes
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
