import FormDialog from "@/components/ui-components/FormDialog";
import { PasswordInput } from "@/components/ui/password-input";
import { queryClient } from "@/util/http";
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

const userRoles = ["Super Admin", "Admin", "Guest User", "Developer"];

export default function NewUser() {
  const authState = useSelector((state) => state.authState);
  const [isSuccess, setIsSuccess] = useState(false);

  const initialUserValues = {
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
          <>
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
                      onChange={(e) => onChange("name", e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>Email Address</Field.Label>
                    <Input
                      type="email"
                      value={values.email}
                      onChange={(e) => onChange("email", e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>Password</Field.Label>
                    <PasswordInput
                      type="password"
                      value={values.password}
                      onChange={(e) => onChange("password", e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>User Role</Field.Label>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        placeholder="Select option"
                        collection={userRoles}
                        value={values.role}
                        onChange={(e) =>
                          onChange("role", e.currentTarget.value)
                        }
                      >
                        {userRoles.map((role) => (
                          <option key={role} value={role}>{role}</option>
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
                      onChange={(e) =>
                        onChange("api_calls_limit", +e.target.value)
                      }
                    />
                  </Field.Root>
                </>
              )}
            </FormDialog>
          </>
        )}
      </Flex>
      {isSuccess &&
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
          document.getElementById("success-message"),
        )}
    </Flex>
  );
}
