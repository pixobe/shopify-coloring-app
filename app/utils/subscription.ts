import { setAppMetafield } from "./graphql/app-metadata";
import { getAppSubscriptionDetails } from "./graphql/app-plan";
import { APP_META_FIELD_SUBSCRIPTION_DETAILS } from "./utilis";

/**
 *
 * @param admin
 * @param shop
 */
export async function updateSubscriptionMetaDetails(admin, shop) {
  const subscriptionDetails = await getAppSubscriptionDetails(admin, shop);
  await setAppMetafield(
    admin,
    APP_META_FIELD_SUBSCRIPTION_DETAILS,
    subscriptionDetails,
  );
}
