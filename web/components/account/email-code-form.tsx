import React, { useEffect, useState } from "react";
import {useTranslation} from 'next-i18next';
import { useForm } from "react-hook-form";
// ui
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// services
import authenticationService from "services/authentication.service";
import useToast from "hooks/use-toast";
import useTimer from "hooks/use-timer";
// icons

// types
type EmailCodeFormValues = {
  email: string;
  key?: string;
  token?: string;
};

export const EmailCodeForm = ({ handleSignIn }: any) => {
  const [codeSent, setCodeSent] = useState(false);
  const [codeResent, setCodeResent] = useState(false);
  const [isCodeResending, setIsCodeResending] = useState(false);
  const [errorResendingCode, setErrorResendingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { setToastAlert } = useToast();
  const { timer: resendCodeTimer, setTimer: setResendCodeTimer } = useTimer();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<EmailCodeFormValues>({
    defaultValues: {
      email: "",
      key: "",
      token: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const isResendDisabled =
    resendCodeTimer > 0 || isCodeResending || isSubmitting || errorResendingCode;

  const onSubmit = async ({ email }: EmailCodeFormValues) => {
    setErrorResendingCode(false);
    await authenticationService
      .emailCode({ email })
      .then((res) => {
        setValue("key", res.key);
        setCodeSent(true);
      })
      .catch((err) => {
        setErrorResendingCode(true);
        setToastAlert({
          title: t("error"),
          type: "error",
          message: err?.error,
        });
      });
  };

  const handleSignin = async (formData: EmailCodeFormValues) => {
    setIsLoading(true);
    await authenticationService
      .magicSignIn(formData)
      .then((response) => {
        handleSignIn(response);
      })
      .catch((error) => {
        setIsLoading(false);
        setToastAlert({
          title: t("error"),
          type: "error",
          message: error?.response?.data?.error ?? t("components.account.enter-correct-code"),
        });
        setError("token" as keyof EmailCodeFormValues, {
          type: "manual",
          message: error?.error,
        });
      });
  };

  const emailOld = getValues("email");

  useEffect(() => {
    setErrorResendingCode(false);
  }, [emailOld]);

  useEffect(() => {
    const submitForm = (e: KeyboardEvent) => {
      if (!codeSent && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(onSubmit)().then(() => {
          setResendCodeTimer(30);
        });
      }
    };

    if (!codeSent) {
      window.addEventListener("keydown", submitForm);
    }

    return () => {
      window.removeEventListener("keydown", submitForm);
    };
  }, [handleSubmit, codeSent]);

  return <>
    {(codeSent || codeResent) && (
      <p className="text-center mt-4">
        {t("components.account.we-sent-code")}
        <br />
        {t("components.account.please-check-inbox")} <span className="font-medium">{watch("email")}</span>
      </p>
    )}
    <form className="space-y-4 mt-10 sm:w-[360px] mx-auto">
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

      {codeSent && (
        <>
          <Input
            id="token"
            type="token"
            name="token"
            register={register}
            validations={{
              required: t("components.account.сode-required"),
            }}
            error={errors.token}
            placeholder={t("components.account.enter-code")}
            className="border-custom-border-300 h-[46px]"
          />
          <button
            type="button"
            className={`flex w-full justify-end text-xs outline-none ${
              isResendDisabled
                ? "cursor-default text-custom-text-200"
                : "cursor-pointer text-custom-primary-100"
            } `}
            onClick={() => {
              setIsCodeResending(true);
              onSubmit({ email: getValues("email") }).then(() => {
                setCodeResent(true);
                setIsCodeResending(false);
                setResendCodeTimer(30);
              });
            }}
            disabled={isResendDisabled}
          >
            {resendCodeTimer > 0 ? (
              <span className="text-right">{t("components.account.request-new-code-in")} {resendCodeTimer} {t("seconds")}</span>
            ) : isCodeResending ? (
              t("components.account.sending-new-code")
            ) : errorResendingCode ? (
              t("please-try-again-later")
            ) : (
              <span className="font-medium">{t("components.account.resend-code")}</span>
            )}
          </button>
        </>
      )}
      {codeSent ? (
        <PrimaryButton
          type="submit"
          className="w-full text-center h-[46px]"
          size="md"
          onClick={handleSubmit(handleSignin)}
          disabled={!isValid && isDirty}
          loading={isLoading}
        >
          {isLoading ? t("components.account.signing-in") : t("sign-in")}
        </PrimaryButton>
      ) : (
        <PrimaryButton
          className="w-full text-center h-[46px]"
          size="md"
          onClick={() => {
            handleSubmit(onSubmit)().then(() => {
              setResendCodeTimer(30);
            });
          }}
          disabled={!isValid && isDirty}
          loading={isSubmitting}
        >
          {isSubmitting ? t("components.account.sending-code") : t("components.account.send-sign-in-code")}
        </PrimaryButton>
      )}
    </form>
  </>;
};
