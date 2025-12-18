import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return Response.json(
      { message: "Shop ID missing", success: false },
      { status: 400 },
    );
  }

  const { admin } = await authenticate.public.appProxy(request);

  if (!admin) {
    return Response.json(
      { message: "Unable to get api data", success: false },
      { status: 400 },
    );
  }

  try {
    // Fetch both settings and installation plan in parallel
    return {
      success: true,
      config: {},
    };
  } catch (error) {
    console.error(
      "Error in api.config loader:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      { message: "Unable to get api data", success: false },
      { status: 400 },
    );
  }
};
