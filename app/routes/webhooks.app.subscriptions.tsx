import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { payload, topic, shop, admin } = await authenticate.webhook(request);
    /**
     * 
     *  const digest = await createDigest(
      `${identifier}${APP_NAME}${plan}${expiry}`,
    );   identifier= shop
     * expiry
     * 
     */
    return new Response();
};
