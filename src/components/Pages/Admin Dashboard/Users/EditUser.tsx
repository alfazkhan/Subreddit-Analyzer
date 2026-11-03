import FormDialog from "@/components/ui-components/FormDialog";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Flex,
  Field,
  Input,
  NativeSelect,
  Alert,
  CloseButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import type { EditUserProps, RootState, UserFormValues } from "@/util/Types";

const userRoles = ["Super Admin", "Admin", "Guest User", "Developer"];

export default function EditUser({ initialUserValues }: EditUserProps) {
  const authState = useSelector((state: RootState) => state.authState);
  const [isSuccess, setIsSuccess] = useState(false);
  const successMessageContainer =
    typeof document === "undefined"
      ? null
      : document.getElementById("success-message");

  function onSuccessHandler() {
    setIsSuccess(true);
  }

  const formInitialValues: UserFormValues = {
    id: initialUserValues.id,
    email: initialUserValues.email,
    password: "",
    name: initialUserValues.name,
    role: initialUserValues.role,
    api_calls_count: initialUserValues.api_calls_count,
    api_calls_limit: initialUserValues.api_calls_limit,
  };

  return (
    <Flex direction="column" gap="3" my="3">
      <Flex justify="flex-end">
        {authState.role === "Super Admin" && (
          <FormDialog
            title="Edit User Profile"
            triggerText="Edit User"
            initialValues={formInitialValues}
            onFormSuccess={onSuccessHandler}
            mode="edit"
          >
            {({ values, onChange }) => (
              <>
                <Field.Root required>
                  <Field.Label>Full Name</Field.Label>
                  <Input
                    value={values.name}
                    onChange={(event) => onChange("name", event.target.value)}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Email Address</Field.Label>
                  <Input
                    type="email"
                    value={values.email}
                    onChange={(event) => onChange("email", event.target.value)}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>New Password</Field.Label>
                  <PasswordInput
                    type="password"
                    value={values.password}
                    onChange={(event) =>
                      onChange("password", event.target.value)
                    }
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>User Role</Field.Label>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      placeholder="Select option"
                      value={values.role}
                      onChange={(event) =>
                        onChange("role", event.currentTarget.value)
                      }
                    >
                      {userRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
                <Field.Root required>
                  <Field.Label>API Calls Count</Field.Label>
                  <Input
                    type="number"
                    value={values.api_calls_count}
                    onChange={(event) =>
                      onChange("api_calls_count", Number(event.target.value))
                    }
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>API Calls Limit</Field.Label>
                  <Input
                    type="number"
                    value={values.api_calls_limit}
                    onChange={(event) =>
                      onChange("api_calls_limit", Number(event.target.value))
                    }
                  />
                </Field.Root>
              </>
            )}
          </FormDialog>
        )}
      </Flex>
      {isSuccess &&
        successMessageContainer &&
        createPortal(
          <Alert.Root status="info" variant="solid">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Success!</Alert.Title>
              <Alert.Description>
                User details has been editied
              </Alert.Description>
            </Alert.Content>
            <CloseButton
              pos="relative"
              top="-2"
              insetEnd="-2"
              onClick={() => setIsSuccess(false)}
            />
          </Alert.Root>,
          successMessageContainer,
        )}
    </Flex>
  );
}
