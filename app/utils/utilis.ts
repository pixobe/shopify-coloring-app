export function formDataToJson(
  fd: FormData,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};

  for (const [key, value] of fd.entries()) {
    // This util is "simple": stringify Files to their name
    const v = value instanceof File ? value.name : String(value);

    const existing = out[key];
    if (existing === undefined) {
      out[key] = v;
    } else if (Array.isArray(existing)) {
      existing.push(v);
    } else {
      out[key] = [existing, v];
    }
  }

  return out;
}

export const APP_META_FIELD_SUBSCRIPTION_DETAILS = "meta_subscription";
