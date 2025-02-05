import { Tooltip as PFTooltip } from '@patternfly/react-core';
import React, { ReactNode } from 'react';

interface IProps {
  children: ReactNode;
  content: string | ReactNode;
}

export const Tooltip = ({ content, children }: IProps) => (
  <PFTooltip content={content}>
    <span>{children}</span>
  </PFTooltip>
);
