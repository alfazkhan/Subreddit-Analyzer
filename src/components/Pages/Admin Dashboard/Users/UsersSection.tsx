import { useMemo, useState } from "react";
import {
  Table,
  HStack,
  Alert,
  CloseButton,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import NewUser from "./NewUser";
import DeleteUser from "./DeleteUser";
import EditUser from "./EditUser";
import GenerateAPIKey from "./GenerateAPIKey";
import paginationDataSlicer from "@/util/paginationDataSlicer";
import DataTable from "@/components/ui-components/Data Table/DataTable";
import { createPortal } from "react-dom";
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
        headers: { Authorization: `Bearer ${token}` },
      },
      ),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
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

  const successMessageContainer = document.getElementById("success-message");

  return (
    <>
      <div id="success-message" />
      {deletedUserInfo &&
        successMessageContainer &&
        createPortal(
          <Alert.Root status="warning" variant="solid" my="3">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Deleted! (id: {deletedUserInfo.id})</Alert.Title>
              <Alert.Description>{`${deletedUserInfo.name}'s account has been successfully deleted!`}</Alert.Description>
            </Alert.Content>
            <CloseButton
              pos="relative"
              top="-2"
              insetEnd="-2"
              onClick={() => setDeletedUserInfo(null)}
            />
          </Alert.Root>,
          successMessageContainer,
        )}

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
