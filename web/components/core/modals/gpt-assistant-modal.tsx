import React, { useEffect, useState, forwardRef, useRef } from "react";
import { useRouter } from "next/router";
// react-hook-form
import { useForm } from "react-hook-form";
// services
import aiService from "services/ai.service";
import trackEventServices from "services/track-event.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
import { TipTapEditor } from "components/tiptap";
// types
import { IIssue, IPageBlock } from "types";
import {useTranslation} from 'next-i18next';
type Props = {
  isOpen: boolean;
  handleClose: () => void;
  inset?: string;
  content: string;
  htmlContent?: string;
  onResponse: (response: string) => void;
  projectId: string;
  block?: IPageBlock;
  issue?: IIssue;
};

type FormData = {
  prompt: string;
  task: string;
};

export const GptAssistantModal: React.FC<Props> = ({
  isOpen,
  handleClose,
  inset = "top-0 left-0",
  content,
  htmlContent,
  onResponse,
  projectId,
  block,
  issue,
}) => {
  const [response, setResponse] = useState("");
  const [invalidResponse, setInvalidResponse] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();

  const editorRef = useRef<any>(null);

  const { setToastAlert } = useToast();

  const {
    handleSubmit,
    register,
    reset,
    setFocus,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      prompt: content,
      task: "",
    },
  });

  const onClose = () => {
    handleClose();
    setResponse("");
    setInvalidResponse(false);
    reset();
  };

  const handleResponse = async (formData: FormData) => {
    if (!workspaceSlug || !projectId) return;

    if (formData.task === "") {
      setToastAlert({
        type: "error",
        title: t("error"),
        message: t("components.core.modals.please-enter-some-task-to-AI"),
      });
      return;
    }

    await aiService
      .createGptTask(
        workspaceSlug as string,
        projectId as string,
        {
          prompt: content && content !== "" ? content : htmlContent ?? "",
          task: formData.task,
        },
        user
      )
      .then((res) => {
        setResponse(res.response_html);
        setFocus("task");

        if (res.response === "") setInvalidResponse(true);
        else setInvalidResponse(false);
      })
      .catch((err) => {
        const error = err?.data?.error;

        if (err.status === 429)
          setToastAlert({
            type: "error",
            title: t("error"),
            message:
              error ||
              t("components.core.modals.have-reached-the-maximum-number"),
          });
        else
          setToastAlert({
            type: "error",
            title: t("error"),
            message: error || t("some-error-occurred"),
          });
      });
  };

  useEffect(() => {
    if (isOpen) setFocus("task");
  }, [isOpen, setFocus]);

  useEffect(() => {
    editorRef.current?.setEditorValue(htmlContent ?? `<p>${content}</p>`);
  }, [htmlContent, editorRef, content]);

  return (
    <div
      className={`absolute ${inset} z-20 w-full space-y-4 rounded-[10px] border border-custom-border-200 bg-custom-background-100 p-4 shadow ${
        isOpen ? "block" : "hidden"
      }`}
    >
      {((content && content !== "") || (htmlContent && htmlContent !== "<p></p>")) && (
        <div className="text-sm">
          Content:
          <TipTapEditor
            workspaceSlug={workspaceSlug as string}
            value={htmlContent ?? `<p>${content}</p>`}
            customClassName="-m-3"
            noBorder
            borderOnFocus={false}
            editable={false}
            ref={editorRef}
          />
        </div>
      )}
      {response !== "" && (
        <div className="page-block-section text-sm">
          Response:
          <TipTapEditor
            workspaceSlug={workspaceSlug as string}
            value={`<p>${response}</p>`}
            customClassName="-mx-3 -my-3"
            noBorder
            borderOnFocus={false}
            editable={false}
          />
        </div>
      )}
      {invalidResponse && (
        <div className="text-sm text-red-500">
          {t("components.core.modals.no-response-could-be-generated")}
        </div>
      )}
      <Input
        type="text"
        name="task"
        register={register}
        placeholder={`${
          content && content !== ""
            ? t("components.core.modals.tell-AI-what-action-perform")
            : t("components.core.modals.ask-AI-anything")
        }`}
        autoComplete="off"
      />
      <div className={`flex gap-2 ${response === "" ? "justify-end" : "justify-between"}`}>
        {response !== "" && (
          <PrimaryButton
            onClick={() => {
              onResponse(response);
              onClose();
              if (block)
                trackEventServices.trackUseGPTResponseEvent(
                  block,
                  "USE_GPT_RESPONSE_IN_PAGE_BLOCK",
                  user
                );
              else if (issue)
                trackEventServices.trackUseGPTResponseEvent(
                  issue,
                  "USE_GPT_RESPONSE_IN_ISSUE",
                  user
                );
            }}
          >
            {t("components.core.modals.use-this-response")}
          </PrimaryButton>
        )}
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={onClose}>{t("close")}</SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleSubmit(handleResponse)}
            loading={isSubmitting}
          >
            {isSubmitting
              ? "Generating response..."
              : response === ""
              ? "Generate response"
              : "Generate again"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
