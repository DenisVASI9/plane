import React from "react";

// contexts
import { ProfileIssuesContextProvider } from "contexts/profile-issues-context";
// layouts
import { ProfileAuthWrapper } from "layouts/profile-layout";
// components
import { ProfileIssuesView } from "components/profile";
// types
import type { NextPage, GetStaticProps } from "next";

import {serverSideTranslations} from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async (context) => ({
    props: {
        ...(await serverSideTranslations(context.locale!)),
    },
});

const ProfileCreatedIssues: NextPage = () => (
  <ProfileIssuesContextProvider>
    <ProfileAuthWrapper>
      <ProfileIssuesView />
    </ProfileAuthWrapper>
  </ProfileIssuesContextProvider>
);

export default ProfileCreatedIssues;
