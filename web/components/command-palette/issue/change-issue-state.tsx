import React, { Dispatch, SetStateAction, useCallback } from "react";
import {useTranslation} from 'next-i18next';
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// cmdk
import { Command } from "cmdk";
// services
import issuesService from "services/issues.service";
import stateService from "services/state.service";
// ui
import { Spinner } from "components/ui";
// icons
import { CheckIcon, StateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { ICurrentUserResponse, IIssue } from "types";
// fetch keys
import { ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY, STATES_LIST } from "constants/fetch-keys";

type Props = {
  setIsPaletteOpen: Dispatch<SetStateAction<boolean>>;
  issue: IIssue;
  user: ICurrentUserResponse | undefined;
};

export const ChangeIssueState: React.FC<Props> = ({ setIsPaletteOpen, issue, user }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;
    const { t } = useTranslation();
  const { data: stateGroups, mutate: mutateIssueDetails } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups);

  const submitChanges = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId) return;

      mutate<IIssue>(
        ISSUE_DETAILS(issueId as string),
        async (prevData) => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            ...formData,
          };
        },
        false
      );

      const payload = { ...formData };
      await issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload, user)
        .then(() => {
          mutateIssueDetails();
          mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, issueId, projectId, mutateIssueDetails, user]
  );

  const handleIssueState = (stateId: string) => {
    submitChanges({ state: stateId });
    setIsPaletteOpen(false);
  };

  return (
    <>
      {states ? (
        states.length > 0 ? (
          states.map((state) => (
            <Command.Item
              key={state.id}
              onSelect={() => handleIssueState(state.id)}
              className="focus:outline-none"
            >
              <div className="flex items-center space-x-3">
                <StateGroupIcon
                  stateGroup={state.group}
                  color={state.color}
                  height="16px"
                  width="16px"
                />
                <p>{state.name}</p>
              </div>
              <div>{state.id === issue.state && <CheckIcon className="h-3 w-3" />}</div>
            </Command.Item>
          ))
        ) : (
          <div className="text-center">{t("components.command-palette.no-states-found")}</div>
        )
      ) : (
        <Spinner />
      )}
    </>
  );
};
