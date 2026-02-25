"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
// Using base html elements since user manually installed and we don't have exact paths for their shadcn setup, 
// wait, user said they installed shadcn components form input label button card.
// We will use standard shadcn imports, but fallback to simple tailwind if it fails
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BorderBeam } from "@/components/magicui/border-beam";

export function LoginForm() {
    const t = useTranslations("Auth.login");
    const [isLoading, setIsLoading] = useState(false);

    const formSchema = z.object({
        email: z.string().email({ message: t("emailError") }),
        password: z.string().min(6, { message: t("passwordError") }),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        // TODO: Supabase Auth integration logic here
        console.log("Login attempted with:", values);

        // Fake delay
        setTimeout(() => {
            setIsLoading(false);
            // Route to dashboard
        }, 1500);
    }

    return (
        <div className="relative rounded-2xl bg-black/40 border border-white/10 p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
            <BorderBeam duration={12} size={300} />

            <div className="relative z-10">
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-block mb-4 text-xs font-medium text-slate-400 hover:text-white transition-colors">
                        ← {t("backToHome")}
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                        {t("titleLine1")}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            {t("titleGradient")}
                        </span>
                    </h1>
                    <p className="text-sm text-slate-400">{t("subtitle")}</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">{t("emailLabel")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("emailPlaceholder")}
                                            {...field}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">{t("passwordLabel")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder={t("passwordPlaceholder")}
                                            {...field}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                t("submitButton")
                            )}
                        </Button>
                    </form>
                </Form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-slate-400">{t("noAccount")}</span>{" "}
                    <Link
                        href="/auth/register"
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                        {t("requestAccess")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
