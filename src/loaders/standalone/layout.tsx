import { Trans, t } from '@lingui/macro';
import {
  Banner,
  DropdownItem,
  DropdownSeparator,
  Page,
  PageHeader,
  PageHeaderTools,
  PageSidebar,
} from '@patternfly/react-core';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import QuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/question-circle-icon';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ActiveUserAPI,
  FeatureFlagsType,
  SettingsType,
  UserType,
} from 'src/api';
import {
  AboutModalWindow,
  LanguageSwitcher,
  LoginLink,
  SmallLogo,
  StatefulDropdown,
} from 'src/components';
import { Paths, formatPath } from 'src/paths';
import { StandaloneMenu } from './menu';

interface IProps {
  children: React.ReactNode;
  featureFlags: FeatureFlagsType;
  hasPermission: (string) => boolean;
  setUser: (user) => void;
  settings: SettingsType;
  user: UserType;
}

export const StandaloneLayout = ({
  children,
  featureFlags,
  hasPermission,
  setUser,
  settings,
  user,
}: IProps) => {
  const location = useLocation();

  const [aboutModalVisible, setAboutModalVisible] = useState<boolean>(false);

  let aboutModal = null;
  let docsDropdownItems = [];
  let userDropdownItems = [];
  let userName: string;

  if (user) {
    userName =
      [user.first_name, user.last_name].filter(Boolean).join(' ') ||
      user.username;

    userDropdownItems = [
      <DropdownItem isDisabled key='username'>
        <Trans>Username: {user.username}</Trans>
      </DropdownItem>,
      <DropdownSeparator key='separator' />,
      <DropdownItem
        key='profile'
        component={
          <Link
            to={formatPath(Paths.userProfileSettings)}
          >{t`My profile`}</Link>
        }
      />,

      <DropdownItem
        key='logout'
        aria-label={'logout'}
        onClick={() =>
          ActiveUserAPI.logout()
            .then(() => ActiveUserAPI.getUser().catch(() => null))
            .then((user) => setUser(user))
        }
      >
        {t`Logout`}
      </DropdownItem>,
    ];

    docsDropdownItems = [
      <DropdownItem
        key='customer_support'
        href='https://access.redhat.com/support'
        target='_blank'
      >
        <Trans>
          Customer Support <ExternalLinkAltIcon />
        </Trans>
      </DropdownItem>,
      <DropdownItem
        key='training'
        href='https://www.ansible.com/resources/webinars-training'
        target='_blank'
      >
        <Trans>
          Training <ExternalLinkAltIcon />
        </Trans>
      </DropdownItem>,
      <DropdownItem key='about' onClick={() => setAboutModalVisible(true)}>
        {t`About`}
      </DropdownItem>,
    ];

    aboutModal = (
      <AboutModalWindow
        isOpen={aboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
        user={user}
        userName={userName}
      />
    );
  }

  const Header = (
    <PageHeader
      logo={<SmallLogo alt={APPLICATION_NAME} />}
      logoComponent={({ children }) => (
        <Link to={formatPath(Paths.landingPage)}>{children}</Link>
      )}
      headerTools={
        <PageHeaderTools>
          <LanguageSwitcher />
          {user ? (
            <StatefulDropdown
              ariaLabel={t`Docs dropdown`}
              data-cy='docs-dropdown'
              defaultText={<QuestionCircleIcon />}
              items={docsDropdownItems}
              toggleType='icon'
            />
          ) : null}
          {!user || user.is_anonymous ? (
            <LoginLink next={location.pathname} />
          ) : (
            <StatefulDropdown
              ariaLabel={t`User dropdown`}
              data-cy='user-dropdown'
              defaultText={userName}
              items={userDropdownItems}
              toggleType='dropdown'
            />
          )}
        </PageHeaderTools>
      }
      showNavToggle
    />
  );

  const Sidebar = (
    <PageSidebar
      theme='dark'
      nav={
        <StandaloneMenu
          context={{ user, settings, featureFlags, hasPermission }}
        />
      }
    />
  );

  return (
    <Page isManagedSidebar={true} header={Header} sidebar={Sidebar}>
      {featureFlags?.ai_deny_index ? (
        <Banner>
          <Trans>
            Thanks for trying out the new and improved Galaxy, please share your
            feedback on{' '}
            <a
              href='https://forum.ansible.com/'
              target='_blank'
              rel='noreferrer'
            >
              forum.ansible.com
            </a>
            .
          </Trans>
        </Banner>
      ) : null}
      {children}
      {aboutModalVisible && aboutModal}
    </Page>
  );
};
