import { useEffect, useMemo, useRef } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { formDataToJson } from "app/utils/utilis";
import { getAppMetafield, setAppMetafield } from "app/utils/graphql/app-metadata";


const META_CONFIG_KEY = "meta_config";
/**
 * 
 * @param request 
 * @returns 
 */
async function getDeepLinking(request) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop; // typically *.myshopify.com
  const apiKey = process.env.SHOPIFY_API_KEY!;
  const appHandle = process.env.APP_HANDLE!;
  const storeHandle = shop.replace(".myshopify.com", "");
  const embedHandle = "app-embed";
  const template = "home";
  const appUrl =
    `https://${shop}/admin/themes/current/editor` +
    `?context=apps&template=${encodeURIComponent(template)}` +
    `&activateAppId=${encodeURIComponent(apiKey)}/${encodeURIComponent(embedHandle)}`;

  const planUrl = `https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`;
  return { appUrl, planUrl };
}


/**
 * 
 * @param param0 
 * @returns 
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  let settings = await getAppMetafield(admin, META_CONFIG_KEY);
  if (!settings) {
    settings = {
      "paint": true,
      "pencil": true,
      "zoom": true,
      "print": true,
      "download": true,
      "brightness": true,
      "colors": "#635151,#B57070,#A72F2F,#DC8585"
    };
  }
  const { planUrl, appUrl } = await getDeepLinking(request);
  return { settings, planUrl, appUrl };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const configEntries = Array.from(formData.entries()).map(([key, value]) => {
    if (value === "on" || value === "true") {
      return [key, true];
    }

    if (value === "false") {
      return [key, false];
    }

    return [key, value];
  });
  const config = Object.fromEntries(configEntries);
  console.log("Saving app data", META_CONFIG_KEY, config);
  return setAppMetafield(admin, META_CONFIG_KEY, config);
};

export default function Index() {
  const { settings, planUrl, appUrl } = useLoaderData<typeof loader>();

  console.log("Settings::::", settings);
  //nullnull
  // {paint: true, pencil: true, zoom: true, print: true, download: true, …}

  const fetcher = useFetcher<{
    success?: boolean;
    config?: Record<string, unknown>;
    message?: string;
  }>();

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.config) {
      shopify.toast.show("Settings updated");
    }
  }, [fetcher.data, shopify]);

  const formRef = useRef<HTMLFormElement>(null);

  const saveSettings = () => {
    const data = formDataToJson(new FormData(formRef.current!));
    const config = Object.fromEntries(
      Object.entries(data).map(([k, v]) => {
        if (v === "on" || v === "true") {
          return [k, true];
        }

        if (v === "false") {
          return [k, false];
        }

        return [k, v];
      }),
    );
    fetcher.submit(config, { method: "POST" });
  };

  return (
    <s-page heading="Pixobe Coloring Book">
      <s-button slot="primary-action" href={appUrl} target="_blank" variant="primary">
        Create Coloring page
      </s-button>

      <s-section heading="Getting Started">
        <s-ordered-list>
          <s-list-item>Open the Theme <s-link href={appUrl} target="_blank">Editor</s-link>.</s-list-item>
          <s-list-item>Select <strong>Add App</strong> from the left panel.</s-list-item>
          <s-list-item>Choose the <strong>Coloring Book</strong> application and place it where you want the coloring canvas to appear.</s-list-item>
          <s-list-item>
            Select an image using the Image Picker for users to color in the block settings, then save the page.
          </s-list-item>
        </s-ordered-list>
      </s-section>

      <s-section>
        <s-paragraph>
          You are currently on <s-text type="strong">Free</s-text> plan. <s-link href={planUrl}>Upgrade</s-link> to enjoy the below features.
        </s-paragraph>
      </s-section>

      <s-section heading="Coloring Settings">
        <form ref={formRef}>
          <s-stack>
            <s-grid
              gridTemplateColumns="repeat(2, 1fr)"
              gap="small"
            >
              <s-grid-item>
                <s-stack>
                  <p-checkbox
                    label="Paint"
                    name="paint"
                    value={settings?.paint}
                  />
                  <p-checkbox
                    label="Pencil"
                    name="pencil"
                    value={settings?.pencil}
                  />
                  <p-checkbox
                    label="Zoom"
                    name="zoom"
                    value={settings?.zoom}
                  />
                  <p-checkbox
                    label="Print"
                    name="print"
                    value={settings?.print}
                  />
                  <p-checkbox
                    label="Download"
                    name="download"
                    value={settings?.download}
                  />
                  <p-checkbox
                    label="Brightness"
                    name="brightness"
                    value={settings?.brightness}
                  />
                </s-stack>
              </s-grid-item>
              <s-grid-item>
                <p-colorswatch name="colors" value={settings?.colors}></p-colorswatch>
              </s-grid-item>
            </s-grid>
            <s-button
              variant="primary"
              onClick={saveSettings}
              disabled={isLoading}
            >
              Save Settings
              {isLoading && <s-spinner></s-spinner>}
            </s-button>
          </s-stack>
        </form>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
