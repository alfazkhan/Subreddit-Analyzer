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
import type { RootState, UserFormValues } from "@/util/Types";

const userRoles = ["Super Admin", "Admin", "Guest User", "Developer"];

export default function NewUser() {
  const authState = useSelector((state: RootState) => state.authState);
  const [isSuccess, setIsSuccess] = useState(false);
  const successMessageContainer =
    typeof document === "undefined"
      ? null
      : document.getElementById("success-message");

  const initialUserValues: UserFormValues = {
    email: "user@example.com",
    password: "",
    name: "Full Name",
    role: "Guest User",
    api_calls_limit: 1000,
  };

  function onSuccessHandler() {
    setIsSuccess(true);
  }

  return (
    <Flex direction="column" gap="3" my="3">
      <Flex justify="flex-end">
        {authState.role === "Super Admin" && (
          <FormDialog
            title="Create New User Profile"
            triggerText="+ Create New User"
            initialValues={initialUserValues}
            onFormSuccess={onSuccessHandler}
            mode="new"
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
                  <Field.Label>Password</Field.Label>
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
          <Alert.Root status="success" variant="solid">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Success!</Alert.Title>
              <Alert.Description>User has been created!</Alert.Description>
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
