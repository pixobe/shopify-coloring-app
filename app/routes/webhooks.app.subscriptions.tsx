import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { updateSubscriptionMetaDetails } from "app/utils/subscription";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, admin } = await authenticate.webhook(request);
  await updateSubscriptionMetaDetails(shop, admin);
  return new Response();
};
