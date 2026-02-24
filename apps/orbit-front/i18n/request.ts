import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    const requestLocaleStr = await requestLocale;

    // Validate that the incoming `locale` parameter is valid
    const locale = (!requestLocaleStr || !(routing.locales as readonly string[]).includes(requestLocaleStr))
        ? routing.defaultLocale
        : requestLocaleStr;

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
