import { PasswordInput } from "@/components/ui/password-input";
import { ADMIN_USER_ROLES } from "@/util/constants";
import type { UserFormValues } from "@/util/Types";
import { Field, Input, NativeSelect } from "@chakra-ui/react";

export interface UserFormFieldsProps {
  values: UserFormValues;
  onChange: (name: string, value: string | number) => void;
  passwordLabel?: string;
  includeApiCallsCount?: boolean;
}

/**
 * Shared user profile fields used by both NewUser and EditUser form dialogs.
 */
export default function UserFormFields({
  values,
  onChange,
  passwordLabel = "Password",
  includeApiCallsCount = false,
}: UserFormFieldsProps) {
  return (
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
        <Field.Label>{passwordLabel}</Field.Label>
        <PasswordInput
          type="password"
          value={values.password}
          onChange={(event) => onChange("password", event.target.value)}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>User Role</Field.Label>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            placeholder="Select option"
            value={values.role}
            onChange={(event) => onChange("role", event.currentTarget.value)}
          >
            {ADMIN_USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>
      {includeApiCallsCount && (
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
      )}
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
  );
}
