import React from "react";
import {useTranslation} from 'next-i18next';
// react hook form
import { useForm } from "react-hook-form";
// services
import userService from "services/user.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// types
type Props = {
  setIsResettingPassword: React.Dispatch<React.SetStateAction<boolean>>;
};

export const EmailResetPasswordForm: React.FC<Props> = ({ setIsResettingPassword }) => {
  const { setToastAlert } = useToast();
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const forgotPassword = async (formData: any) => {
    const payload = {
      email: formData.email,
    };

    await userService
      .forgotPassword(payload)
      .then(() =>
        setToastAlert({
          type: "success",
          title: t("success"),
          message: t("components.account.password-reset-link-sent"),
        })
      )
      .catch((err) => {
        if (err.status === 400)
          setToastAlert({
            type: "error",
            title: t("error"),
            message: t("components.account.please-check-email"),
          });
        else
          setToastAlert({
            type: "error",
            title: t("error"),
            message: t("something-went-wrong"),
          });
      });
  };

  return (
    <form
      className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto"
      onSubmit={handleSubmit(forgotPassword)}
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
          placeholder={t("components.account.enter-registered-email")}
          className="border-custom-border-300 h-[46px]"
        />
      </div>
      <div className="mt-5 flex flex-col-reverse sm:flex-row items-center gap-2">
        <SecondaryButton
          className="w-full text-center h-[46px]"
          onClick={() => setIsResettingPassword(false)}
        >
          Go Back
        </SecondaryButton>
        <PrimaryButton type="submit" className="w-full text-center h-[46px]" loading={isSubmitting}>
          {isSubmitting ? t("components.account.sending-link") : t("components.account.send-reset-link")}
        </PrimaryButton>
      </div>
    </form>
  );
};
