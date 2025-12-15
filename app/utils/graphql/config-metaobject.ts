type Result<T> =
  | { success: true; config: T }
  | { success: false; message: string };

type AdminGraphqlClient = {
  graphql: (query: string, options?: { variables?: any }) => Promise<Response>;
};

type ConfigResponse = {
  config?: Record<string, unknown>;
  success: boolean;
  message?: string;
};

const SETTINGS_METAOBJECT_TYPE = "$app:settings";

const LOAD_SETTINGS_QUERY = `
  query PixobeProductSettings($type: String!, $first: Int!) {
    metaobjects(first: $first, type: $type) {
      nodes {
        id
        fields {
          key
          value
        }
      }
    }
  }
`;

const CREATE_SETTINGS_MUTATION = `
  mutation CreatePixobeSettings($type: String!, $config: String!) {
    metaobjectCreate(
      metaobject: {
        type: $type,
        fields: [
          { key: "config", value: $config }
        ]
      }
    ) {
      metaobject {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_SETTINGS_MUTATION = `
  mutation UpdatePixobeSettings($id: ID!, $config: String!) {
    metaobjectUpdate(
      id: $id,
      metaobject: {
        fields: [
          { key: "config", value: $config }
        ]
      }
    ) {
      metaobject {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ensureOk = async (response: Response): Promise<any> => {
  if (!response.ok) {
    throw new Error(`GraphQL request failed (${response.status})`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    const message = payload.errors
      .map((error: { message: string }) => error.message)
      .join(", ");
    throw new Error(message);
  }

  return payload.data;
};

const extractConfig = (data: any): Record<string, unknown> => {
  const nodes:
    | Array<{ id: string; fields: Array<{ key: string; value: string }> }>
    | undefined = data?.metaobjects?.nodes;

  if (!nodes?.length) {
    return {};
  }

  const configField = nodes[0].fields.find((field) => field.key === "config");
  if (!configField?.value) {
    return {};
  }

  try {
    return JSON.parse(configField.value);
  } catch {
    return {};
  }
};

/**
 *
 * @param admin
 * @returns
 */
export function createLoadColoringSettings(admin: AdminGraphqlClient) {
  return async (): Promise<ConfigResponse> => {
    try {
      const response = await admin.graphql(LOAD_SETTINGS_QUERY, {
        variables: { type: SETTINGS_METAOBJECT_TYPE, first: 1 },
      });
      const data = await ensureOk(response);
      return { success: true, config: extractConfig(data) };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };
}

export function createSaveColoringSettings(admin: AdminGraphqlClient) {
  return async (
    config: Record<string, unknown>,
  ): Promise<Result<Record<string, unknown>>> => {
    try {
      // Optimistically try loading existing settings so we can update instead of creating
      const response = await admin.graphql(LOAD_SETTINGS_QUERY, {
        variables: { type: SETTINGS_METAOBJECT_TYPE, first: 1 },
      });
      const data = await ensureOk(response);
      const nodes: Array<{ id: string }> | undefined = data?.metaobjects?.nodes;

      const configJson = JSON.stringify(config);
      let mutation = CREATE_SETTINGS_MUTATION;
      let variables: Record<string, unknown> = {
        type: SETTINGS_METAOBJECT_TYPE,
        config: configJson,
      };

      if (nodes?.[0]?.id) {
        mutation = UPDATE_SETTINGS_MUTATION;
        variables = { id: nodes[0].id, config: configJson };
      }

      const saveResponse = await admin.graphql(mutation, { variables });
      const saveData = await ensureOk(saveResponse);
      const userErrors =
        saveData?.metaobjectCreate?.userErrors ??
        saveData?.metaobjectUpdate?.userErrors ??
        [];

      if (userErrors.length) {
        throw new Error(
          userErrors
            .map((error: { message: string }) => error.message)
            .join(", "),
        );
      }

      return { success: true, config };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };
}
