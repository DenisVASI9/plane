import React, { useEffect } from "react";

import { useRouter } from "next/router";

// services
import appInstallationsService from "services/app-installations.service";
// ui
import { Spinner } from "components/ui";

import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import {GetStaticProps} from "next";

export const getStaticProps: GetStaticProps = async (context) => ({
    props: {
        ...(await serverSideTranslations(context.locale!)),
    },
});

export async function getStaticPaths() {
    return {
        paths: [],
        fallback: 'blocking',
    };
}


const AppPostInstallation = () => {
  const router = useRouter();
  const { installation_id, setup_action, state, provider, code } = router.query;

  useEffect(() => {
    if (provider === "github" && state && installation_id) {
      appInstallationsService
        .addInstallationApp(state.toString(), provider, { installation_id })
        .then(() => {
          window.opener = null;
          window.open("", "_self");
          window.close();
        })
        .catch((err) => {
          console.log(err);
        });
    } else if (provider === "slack" && state && code) {
      appInstallationsService
        .getSlackAuthDetails(code.toString())
        .then((res) => {
          const [workspaceSlug, projectId, integrationId] = state.toString().split(",");

          if (!projectId) {
            const payload = {
              metadata: {
                ...res,
              },
            };

            appInstallationsService
              .addInstallationApp(state.toString(), provider, payload)
              .then((r) => {
                window.opener = null;
                window.open("", "_self");
                window.close();
              })
              .catch((err) => {
                throw err?.response;
              });
          } else {
            const payload = {
              access_token: res.access_token,
              bot_user_id: res.bot_user_id,
              webhook_url: res.incoming_webhook.url,
              data: res,
              team_id: res.team.id,
              team_name: res.team.name,
              scopes: res.scope,
            };
            appInstallationsService
              .addSlackChannel(workspaceSlug, projectId, integrationId, payload)
              .then((r) => {
                window.opener = null;
                window.open("", "_self");
                window.close();
              })
              .catch((err) => {
                throw err.response;
              });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [state, installation_id, provider, code]);

  return (
    <div className="absolute top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center gap-y-3 bg-custom-background-80">
      <h2 className="text-2xl text-custom-text-100">Installing. Please wait...</h2>
      <Spinner />
    </div>
  );
};

export default AppPostInstallation;
