import {
  Container,
  Heading,
  Table,
  StatusBadge,
  Button,
  Input,
  Label,
  Copy,
} from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Key } from "@medusajs/icons";
import { client } from "../../../lib/client";

type ApiKey = {
  id: string;
  title: string;
  token: string;
  type: string;
  created_at: string;
};
type ApiKeysResponse = { api_keys: ApiKey[] };

const fetchApiKeys = async (): Promise<ApiKeysResponse> => {
  const { data } = await client.get<ApiKeysResponse>(
    "/admin/api-keys?limit=20",
  );
  return data;
};
const createApiKey = async (title: string) => {
  const { data } = await client.post<{ api_key: ApiKey }>("/admin/api-keys", {
    title,
    type: "publishable",
  });
  return data;
};
const revokeApiKey = async (id: string) => {
  await client.delete(`/admin/api-keys/${id}`);
};

const ApiKeysPage = () => {
  const queryClient = useQueryClient();
  const [newKeyTitle, setNewKeyTitle] = useState("");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["settings-api-keys"],
    queryFn: fetchApiKeys,
  });
  const createMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-api-keys"] });
      setNewKeyTitle("");
    },
  });
  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-api-keys"] });
    },
  });

  return (
    <Container>
      <div className="flex flex-col gap-4 mb-8 border-b pb-6">
        <Heading level="h1">API Key Management</Heading>
        <p className="text-ui-fg-subtle">
          Manage Publishable API Keys for your storefronts.
        </p>
        <div className="flex gap-2 items-end max-w-md">
          <div className="w-full">
            <Label size="small" weight="plus">
              Create New Key
            </Label>
            <Input
              placeholder="e.g. Storefront V1"
              value={newKeyTitle}
              onChange={(e) => setNewKeyTitle(e.target.value as any)}
            />
          </div>
          <Button
            onClick={() => createMutation.mutate(newKeyTitle)}
            disabled={!newKeyTitle || createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
        {createMutation.isError && (
          <p className="text-red-500 text-sm">Failed to create key</p>
        )}
      </div>
      {isError && (
        <div className="text-red-500 mb-4">
          Error: {error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown"}
        </div>
      )}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>Token</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Created At</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.api_keys?.map((key) => (
              <Table.Row key={key.id}>
                <Table.Cell>{key.title}</Table.Cell>
                <Table.Cell className="font-mono text-xs">
                  {key.token}
                  <Copy content={key.token} className="inline-block ml-2" />
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge color="blue">{key.type}</StatusBadge>
                </Table.Cell>
                <Table.Cell>
                  {new Date(key.created_at).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => revokeMutation.mutate(key.id)}
                    disabled={revokeMutation.isPending}
                  >
                    Revoke
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
            {(!data?.api_keys || data.api_keys.length === 0) && (
              <Table.Row>
                <td colSpan={5} className="text-center py-8 text-ui-fg-subtle">
                  No API Keys found. Create one above.
                </td>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({ label: "API Keys", icon: Key });
export default ApiKeysPage;
