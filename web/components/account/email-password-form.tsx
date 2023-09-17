import React, {useState} from "react";
import {useTranslation} from 'next-i18next';
import {useRouter} from "next/router";
import Link from "next/link";

// react hook form
import {useForm} from "react-hook-form";
// components
import {EmailResetPasswordForm} from "components/account";
// ui
import {Input, PrimaryButton} from "components/ui";
// types
type EmailPasswordFormValues = {
    email: string;
    password?: string;
    medium?: string;
};

type Props = {
    onSubmit: (formData: EmailPasswordFormValues) => Promise<void>;
};

export const EmailPasswordForm: React.FC<Props> = ({onSubmit}) => {
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const {t} = useTranslation();
    const router = useRouter();
    const isSignUpPage = router.pathname === "/sign-up";

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting, isValid, isDirty},
    } = useForm<EmailPasswordFormValues>({
        defaultValues: {
            email: "",
            password: "",
            medium: "email",
        },
        mode: "onChange",
        reValidateMode: "onChange",
    });

    return <>
        <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-custom-text-100">
            {isResettingPassword
                ? t("components.account.reset-your-password")
                : isSignUpPage
                    ? t("components.account.sign-up-Plane")
                    : t("components.account.sign-in-Plane")}
        </h1>
        {isResettingPassword ? (
            <EmailResetPasswordForm setIsResettingPassword={setIsResettingPassword}/>
        ) : (
            <form
                className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto"
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className="space-y-1">
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        register={register}
                        validations={{
                            required: t("components.account.email-required"),
                            validate: (value) =>
                                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                                    value
                                ) || t("components.account.email-not-valid"),
                        }}
                        error={errors.email}
                        placeholder={t("components.account.enter-your-email")}
                        className="border-custom-border-300 h-[46px]"
                    />
                </div>
                <div className="space-y-1">
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        register={register}
                        validations={{
                            required: t("components.account.password-required"),
                        }}
                        error={errors.password}
                        placeholder={t("components.account.enter-your-password")}
                        className="border-custom-border-300 h-[46px]"
                    />
                </div>
                <div className="text-right text-xs">
                    {isSignUpPage ? (
                        <Link href="/" className="text-custom-text-200 hover:text-custom-primary-100">

                            {t("components.account.already-have-account")}

                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsResettingPassword(true)}
                            className="text-custom-text-200 hover:text-custom-primary-100"
                        >
                            {t("components.account.forgot-password")}
                        </button>
                    )}
                </div>
                <div>
                    <PrimaryButton
                        type="submit"
                        className="w-full text-center h-[46px]"
                        disabled={!isValid && isDirty}
                        loading={isSubmitting}
                    >
                        {isSignUpPage
                            ? isSubmitting
                                ? t("components.account.signing-up")
                                : t("components.account.sign-up")
                            : isSubmitting
                                ? t("components.account.signing-in")
                                : t("sign-in")}
                    </PrimaryButton>
                    {!isSignUpPage && (
                        (<Link
                            href="/sign-up"
                            className="block text-custom-text-200 hover:text-custom-primary-100 text-xs mt-4">
                            {t("components.account.dont-have-account")}
                        </Link>)
                    )}
                </div>
            </form>
        )}
    </>;
};
