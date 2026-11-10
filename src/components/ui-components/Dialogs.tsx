import { forwardRef, useImperativeHandle, useState } from "react";
import { Button, CloseButton, Dialog, IconButton, Portal } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { FiEdit } from "react-icons/fi";
import {
  createAuthHeaders,
  editingData,
  queryClient,
  sendingData,
} from "@/util/api";
import { LoadingAndError } from "./Feedback";
import type {
  AlertDialogHandle,
  AlertDialogProps,
  FormDialogProps,
  MutationBody,
  RootState,
  UserFormValues,
} from "@/util/Types";

// ── AlertDialog ────────────────────────────────────────────────────

export const AlertDialog = forwardRef<AlertDialogHandle, AlertDialogProps>(
  ({ onDelete, id, message }, ref) => {
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => {
      return {
        open() {
          setOpen(true);
        },
        close() {
          setOpen(false);
        },
      };
    });

    return (
      <Dialog.Root role="dialog" modal open={open}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content color="black">
              <Dialog.Header>
                <Dialog.Title>Are you sure?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>{message}</p>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="red"
                  fontWeight="bolder"
                  onClick={() => onDelete(id)}
                >
                  Delete
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={() => setOpen(false)} />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  },
);

// ── FormDialog ─────────────────────────────────────────────────────

export function FormDialog({
  title,
  triggerText,
  initialValues,
  children,
  onFormSuccess,
  mode,
}: FormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<UserFormValues>(initialValues);

  const authState = useSelector((state: RootState) => state.authState);

  const { mutate, isError, error, isPending } = useMutation({
    mutationFn: mode === "new" ? sendingData : editingData,
    onSuccess: () => {
      setOpen(false);
      onFormSuccess();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleInputChange = (name: string, value: string | number) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isNew = mode === "new";
    const endpoint = isNew ? "users/create" : `users/${formValues.id}`;
    const payload: UserFormValues = isNew
      ? formValues
      : {
          email: formValues.email,
          password: formValues.password,
          name: formValues.name,
          role: formValues.role,
          api_calls_count: formValues.api_calls_count,
          api_calls_limit: formValues.api_calls_limit,
        };

    const body: MutationBody = {
      endpoint,
      signal: undefined,
      headers: createAuthHeaders(authState.token),
      body: payload,
    };
    mutate(body);
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
              onSubmit={handleSubmit}
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
