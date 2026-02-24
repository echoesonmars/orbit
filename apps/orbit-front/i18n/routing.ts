import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
    locales: ["ru", "en", "kk"],
    defaultLocale: "ru",
    localePrefix: "as-needed",
});

// Lightweight wrappers around Next.js' navigation APIs
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
