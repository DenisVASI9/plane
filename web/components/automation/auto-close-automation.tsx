import React, { useState } from "react";
import {useTranslation} from 'next-i18next';
import useSWR from "swr";

import { useRouter } from "next/router";

// component
import { CustomSearchSelect, CustomSelect, Icon, ToggleSwitch } from "components/ui";
import { SelectMonthModal } from "components/automation";
// icons
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import { StateGroupIcon } from "components/icons";
import { ArchiveX } from "lucide-react";
// services
import stateService from "services/state.service";
// constants
import { PROJECT_AUTOMATION_MONTHS } from "constants/project";
import { STATES_LIST } from "constants/fetch-keys";
// types
import { IProject } from "types";
// helper
import { getStatesList } from "helpers/state.helper";

type Props = {
  projectDetails: IProject | undefined;
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export const AutoCloseAutomation: React.FC<Props> = ({ projectDetails, handleChange }) => {
  const [monthModal, setmonthModal] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups);

  const options = states
    ?.filter((state) => state.group === "cancelled")
    .map((state) => ({
      value: state.id,
      query: state.name,
      content: (
        <div className="flex items-center gap-2">
          <StateGroupIcon stateGroup={state.group} color={state.color} height="16px" width="16px" />
          {state.name}
        </div>
      ),
    }));

  const multipleOptions = (options ?? []).length > 1;

  const defaultState = stateGroups && stateGroups.cancelled ? stateGroups.cancelled[0].id : null;

  const selectedOption = states?.find(
    (s) => s.id === projectDetails?.default_state ?? defaultState
  );
  const currentDefaultState = states?.find((s) => s.id === defaultState);

  const initialValues: Partial<IProject> = {
    close_in: 1,
    default_state: defaultState,
  };

  return (
    <>
      <SelectMonthModal
        type="auto-close"
        initialValues={initialValues}
        isOpen={monthModal}
        handleClose={() => setmonthModal(false)}
        handleChange={handleChange}
      />

      <div className="flex flex-col gap-4 border-b border-custom-border-200 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center p-3 rounded bg-custom-background-90">
              <ArchiveX className="h-4 w-4 text-red-500 flex-shrink-0" />
            </div>
            <div className="">
              <h4 className="text-sm font-medium">{t("components.automation.auto-close-issues")}</h4>
              <p className="text-sm text-custom-text-200 tracking-tight">
                {t("components.automation.plane-auto-close-issues")}
              </p>
            </div>
          </div>
          <ToggleSwitch
            value={projectDetails?.close_in !== 0}
            onChange={() =>
              projectDetails?.close_in === 0
                ? handleChange({ close_in: 1, default_state: defaultState })
                : handleChange({ close_in: 0, default_state: null })
            }
            size="sm"
          />
        </div>

        {projectDetails?.close_in !== 0 && (
          <div className="ml-12">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded px-5 py-4 bg-custom-background-90 border border-custom-border-200 gap-2 w-full">
                <div className="w-1/2 text-sm font-medium">
                  {t("components.automation.auto-close-issues-inactive-for")}
                </div>
                <div className="w-1/2">
                  <CustomSelect
                    value={projectDetails?.close_in}
                    label={`${projectDetails?.close_in} ${
                      projectDetails?.close_in === 1 ? t("month") : t("months")
                    }`}
                    onChange={(val: number) => {
                      handleChange({ close_in: val });
                    }}
                    input
                    width="w-full"
                  >
                    <>
                      {PROJECT_AUTOMATION_MONTHS.map((month) => (
                        <CustomSelect.Option key={month.label} value={month.value}>
                          {month.label}
                        </CustomSelect.Option>
                      ))}
                      <button
                        type="button"
                        className="flex w-full select-none items-center rounded px-1 py-1.5 text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => setmonthModal(true)}
                      >
                        {t("components.automation.customise-time-range")}
                      </button>
                    </>
                  </CustomSelect>
                </div>
              </div>

              <div className="flex items-center justify-between rounded px-5 py-4 bg-custom-background-90 border border-custom-border-200 gap-2 w-full">
                <div className="w-1/2 text-sm font-medium">{t("components.automation.auto-close-status")}</div>
                <div className="w-1/2 ">
                  <CustomSearchSelect
                    value={
                      projectDetails?.default_state ? projectDetails?.default_state : defaultState
                    }
                    label={
                      <div className="flex items-center gap-2">
                        {selectedOption ? (
                          <StateGroupIcon
                            stateGroup={selectedOption.group}
                            color={selectedOption.color}
                            height="16px"
                            width="16px"
                          />
                        ) : currentDefaultState ? (
                          <StateGroupIcon
                            stateGroup={currentDefaultState.group}
                            color={currentDefaultState.color}
                            height="16px"
                            width="16px"
                          />
                        ) : (
                          <Squares2X2Icon className="h-3.5 w-3.5 text-custom-text-200" />
                        )}
                        {selectedOption?.name
                          ? selectedOption.name
                          : currentDefaultState?.name ?? (
                              <span className="text-custom-text-200">{t("components.automation.state")}</span>
                            )}
                      </div>
                    }
                    onChange={(val: string) => {
                      handleChange({ default_state: val });
                    }}
                    options={options}
                    disabled={!multipleOptions}
                    width="w-full"
                    input
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
