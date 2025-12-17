import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createLoadColoringSettings } from "app/utils/graphql/config-metaobject";

const APP_NAME = "Colorgizer";

// GraphQL query to get current app installation plan and subscription details
const GET_APP_INSTALLATION_PLAN = `
  query GetAppInstallationPlan {
    currentAppInstallation {
      activeSubscriptions {
        name
        status
        currentPeriodEnd
        lineItems {
          plan {
            pricingDetails {
              ... on AppRecurringPricing {
                price {
                  amount
                }
              }
              ... on AppUsagePricing {
                cappedAmount {
                  amount
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Creates a SHA-256 digest from a message
 * @param message
 * @returns hex string of SHA-256 digest
 */
async function createDigest(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * Determines the plan name from active subscriptions
 * Returns 'free' if no active subscriptions, otherwise returns subscription name or 'paid'
 */
function getPlanFromSubscriptions(
  activeSubscriptions:
    | Array<{
        name?: string;
        status?: string;
      }>
    | null
    | undefined,
): string {
  console.log(
    "Active Subscription ************************************",
    activeSubscriptions,
  );
  if (!activeSubscriptions || activeSubscriptions.length === 0) {
    return "Free";
  }

  // Return the first active subscription name if available
  const activeSubscription = activeSubscriptions.find(
    (sub) => sub.status === "ACTIVE" || sub.status === "PENDING",
  );
  return activeSubscription?.name || "Pro";
}

/**
 * Formats the expiry date from subscription's currentPeriodEnd
 */
function getExpiryFromSubscription(
  activeSubscriptions:
    | Array<{
        currentPeriodEnd?: string;
        status?: string;
      }>
    | null
    | undefined,
): string {
  if (!activeSubscriptions || activeSubscriptions.length === 0) {
    return "";
  }

  const activeSubscription = activeSubscriptions.find(
    (sub) => sub.status === "ACTIVE" || sub.status === "PENDING",
  );

  if (activeSubscription?.currentPeriodEnd) {
    // Format the date to ISO string or specific format
    return activeSubscription.currentPeriodEnd;
  }

  return new Date().toISOString().split("T")[0];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("Getting pricing plan for the app******************************");

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
    const [settingsResult, installationResponse] = await Promise.all([
      createLoadColoringSettings(admin)(),
      admin.graphql(GET_APP_INSTALLATION_PLAN),
    ]);

    if (!settingsResult.success) {
      return Response.json(
        { error: "Unable to load settings", message: settingsResult.message },
        { status: 500 },
      );
    }

    const settings = settingsResult.config;

    // Parse the installation/plan response
    let plan = "free";
    let expiry = "";

    try {
      const planData = await installationResponse.json();

      if (planData.data?.currentAppInstallation?.activeSubscriptions) {
        const activeSubscriptions =
          planData.data.currentAppInstallation.activeSubscriptions;

        plan = getPlanFromSubscriptions(activeSubscriptions);
        expiry = getExpiryFromSubscription(activeSubscriptions);
      }
    } catch (error) {
      console.warn(
        "Failed to fetch app installation plan:",
        error instanceof Error ? error.message : "Unknown error",
      );
      plan = "free";
    }

    const identifier = shop;
    const digest = await createDigest(
      `${identifier}${APP_NAME}${plan}${expiry}`,
    );

    return Response.json({ settings, digest, identifier, plan, expiry });
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
