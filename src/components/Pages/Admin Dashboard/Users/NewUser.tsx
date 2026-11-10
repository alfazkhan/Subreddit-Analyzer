import { FormDialog } from "@/components/ui-components/Dialogs";
import { PortalAlert } from "@/components/ui-components/Feedback";
import { Flex } from "@chakra-ui/react";
import { useState } from "react";
import { useSelector } from "react-redux";
import UserFormFields from "./UserFormFields";
import type { RootState, UserFormValues } from "@/util/Types";

export default function NewUser() {
  const authState = useSelector((state: RootState) => state.authState);
  const [isSuccess, setIsSuccess] = useState(false);

  const initialUserValues: UserFormValues = {
    email: "user@example.com",
    password: "",
    name: "Full Name",
    role: "Guest User",
    api_calls_limit: 1000,
  };

  return (
    <Flex direction="column" gap="3" my="3">
      <Flex justify="flex-end">
        {authState.role === "Super Admin" && (
          <FormDialog
            title="Create New User Profile"
            triggerText="+ Create New User"
            initialValues={initialUserValues}
            onFormSuccess={() => setIsSuccess(true)}
            mode="new"
          >
            {({ values, onChange }) => (
              <UserFormFields values={values} onChange={onChange} />
            )}
          </FormDialog>
        )}
      </Flex>
      <PortalAlert
        open={isSuccess}
        status="success"
        title="Success!"
        description="User has been created!"
        onClose={() => setIsSuccess(false)}
      />
    </Flex>
  );
}
