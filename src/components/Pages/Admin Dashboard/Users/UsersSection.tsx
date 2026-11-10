import { useMemo, useState } from "react";
import {
  Table,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createAuthHeaders, fetchingData } from "@/util/api";
import { LoadingAndError, PortalAlert } from "@/components/ui-components/Feedback";
import NewUser from "./NewUser";
import DeleteUser from "./DeleteUser";
import EditUser from "./EditUser";
import GenerateAPIKey from "./GenerateAPIKey";
import { paginationDataSlicer } from "@/util/data";
import DataTable from "@/components/ui-components/Data Table/DataTable";
import { useSelector } from "react-redux";
import type { AdminUser, RootState } from "@/util/Types";

export default function UsersSection() {
  const [deletedUserInfo, setDeletedUserInfo] = useState<AdminUser | null>(null);
  const token = useSelector((state: RootState) => state.authState.token);
  const currentPage = 1;
  const pageSize = 20;

  const {
    data: users,
    isPending,
    isLoading,
    isError,
    error,
  } = useQuery<AdminUser[]>({
    queryKey: ["users"],
    queryFn: ({ signal }) =>
      fetchingData({
        endpoint: "users",
        signal,
        headers: createAuthHeaders(token, false),
      }),
  });

  const paginatedSlice: AdminUser[] = useMemo(
    () => paginationDataSlicer(users ?? [], currentPage, pageSize) ?? [],
    [users, currentPage, pageSize],
  );

  if (isError || isPending || isLoading) {
    return (
      <LoadingAndError isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <>
      <div id="success-message" />
      <PortalAlert
        open={Boolean(deletedUserInfo)}
        status="warning"
        my="3"
        title={`Deleted! (id: ${deletedUserInfo?.id})`}
        description={`${deletedUserInfo?.name}'s account has been successfully deleted!`}
        onClose={() => setDeletedUserInfo(null)}
      />

      <NewUser />
      <DataTable
        data={users ?? []}
        tableHeaders={[
          "Name",
          "Email",
          "Role",
          "API Key",
          "API Calls Count",
          "API Calls limit",
          "",
        ]}
      >
        {paginatedSlice.map((user) => (
          <Table.Row key={user.id} textAlign="center">
            <Table.Cell>{user.name}</Table.Cell>
            <Table.Cell>{user.email}</Table.Cell>
            <Table.Cell>{user.role}</Table.Cell>
            <Table.Cell maxWidth="100px">
              {user.api_key ? (
                <Text lineClamp="10">{user.api_key}</Text>
              ) : (
                <GenerateAPIKey />
              )}
            </Table.Cell>
            <Table.Cell>{user.api_calls_count}</Table.Cell>
            <Table.Cell>
              {user.api_calls_limit === -1
                ? "Unlimited"
                : user.api_calls_limit}
            </Table.Cell>
            <Table.Cell>
              <HStack>
                <EditUser initialUserValues={user} />
                <DeleteUser
                  user={user}
                  onDeleteSuccess={setDeletedUserInfo}
                />
              </HStack>
            </Table.Cell>
          </Table.Row>
        ))}
      </DataTable>
    </>
  );
}
