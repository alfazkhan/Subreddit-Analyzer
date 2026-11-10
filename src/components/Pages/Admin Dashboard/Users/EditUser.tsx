import { FormDialog } from "@/components/ui-components/Dialogs";
import { PortalAlert } from "@/components/ui-components/Feedback";
import { Flex } from "@chakra-ui/react";
import { useState } from "react";
import { useSelector } from "react-redux";
import UserFormFields from "./UserFormFields";
import type { EditUserProps, RootState, UserFormValues } from "@/util/Types";

export default function EditUser({ initialUserValues }: EditUserProps) {
  const authState = useSelector((state: RootState) => state.authState);
  const [isSuccess, setIsSuccess] = useState(false);

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
            onFormSuccess={() => setIsSuccess(true)}
            mode="edit"
          >
            {({ values, onChange }) => (
              <UserFormFields
                values={values}
                onChange={onChange}
                passwordLabel="New Password"
                includeApiCallsCount
              />
            )}
          </FormDialog>
        )}
      </Flex>
      <PortalAlert
        open={isSuccess}
        status="info"
        title="Success!"
        description="User details has been editied"
        onClose={() => setIsSuccess(false)}
      />
    </Flex>
  );
}
