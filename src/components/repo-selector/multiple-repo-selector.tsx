import { t } from '@lingui/macro';
import {
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownToggleCheckbox,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  Spinner,
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import React, { useEffect, useState } from 'react';
import { AnsibleRepositoryAPI, AnsibleRepositoryType } from 'src/api';
import {
  AlertType,
  AppliedFilters,
  CheckboxRow,
  CompoundFilter,
  Pagination,
  RadioRow,
  SortTable,
} from 'src/components';
import { errorMessage } from 'src/utilities';

interface IProps {
  addAlert: (alert: AlertType) => void;
  disabledRepos?: string[];
  params?: { pulp_label_select?: string };
  selectedRepos: AnsibleRepositoryType[];
  setSelectedRepos: (selectedRepos: AnsibleRepositoryType[]) => void;
  singleSelectionOnly?: boolean;
}

export const MultipleRepoSelector = (props: IProps) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [repositoryList, setRepositoryList] = useState<AnsibleRepositoryType[]>(
    [],
  );
  const [itemsCount, setItemsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    page_size: 10,
    sort: 'name',
  });

  const selectedRepos = props.selectedRepos.map(({ name }) => name);
  const disabledRepos = props.disabledRepos || [];

  const isSelectorChecked = repositoryList
    .map(({ name }) => name)
    .every((n) => selectedRepos.includes(n) || disabledRepos.includes(n));

  function loadRepos() {
    setLoading(true);

    AnsibleRepositoryAPI.list({
      ...params,
      ...(props.params || {}),
    })
      .then(({ data: { count, results } }) => {
        setRepositoryList(results);
        setItemsCount(count);
      })
      .catch(({ response: { status, statusText } }) =>
        props.addAlert({
          title: t`Failed to load repositories.`,
          variant: 'danger',
          description: errorMessage(status, statusText),
        }),
      )
      .finally(() => setLoading(false));
  }

  function changeSelection(repo) {
    const { name } = repo;
    if (disabledRepos.includes(name)) {
      return;
    }

    const checked = selectedRepos.includes(name);

    if (checked) {
      // remove
      props.setSelectedRepos(
        props.selectedRepos.filter(({ name: element }) => element != name),
      );
    } else {
      // add
      props.setSelectedRepos([...props.selectedRepos, repo]);
    }
  }

  function setSelection(repo) {
    props.setSelectedRepos(repo ? [repo] : null);
  }

  function renderLabels() {
    return (
      <Flex>
        <FlexItem>
          <b>{t`Selected`}</b>
        </FlexItem>
        <FlexItem>
          <LabelGroup>
            {selectedRepos.map((name) => (
              <>
                <Label onClose={() => changeSelection({ name })}>{name}</Label>{' '}
              </>
            ))}
          </LabelGroup>
        </FlexItem>
      </Flex>
    );
  }

  useEffect(() => {
    loadRepos();
  }, [params, props.params?.pulp_label_select]);

  function renderMultipleSelector() {
    function onToggle(isOpen: boolean) {
      setIsSelectorOpen(isOpen);
    }

    function onFocus() {
      const element = document.getElementById('toggle-split-button');
      element.focus();
    }

    function onSelect() {
      setIsSelectorOpen(false);
      onFocus();
    }

    function selectPage() {
      const newRepos = [...props.selectedRepos];

      repositoryList.forEach((repo) => {
        if (
          !selectedRepos.includes(repo.name) &&
          !disabledRepos.includes(repo.name)
        ) {
          newRepos.push(repo);
        }
      });

      props.setSelectedRepos(newRepos);
    }

    function deselectAll() {
      props.setSelectedRepos([]);
    }

    function deselectPage() {
      const newRepos = props.selectedRepos.filter(
        ({ name: repo1 }) =>
          !repositoryList.find(({ name: repo2 }) => repo1 === repo2),
      );

      props.setSelectedRepos(newRepos);
    }

    function onToggleCheckbox() {
      if (isSelectorChecked) {
        deselectPage();
      } else {
        selectPage();
      }
    }

    const dropdownItems = [
      <DropdownItem
        onClick={selectPage}
        key='select-page'
      >{t`Select page (${repositoryList.length} items)`}</DropdownItem>,
      <DropdownItem
        onClick={deselectPage}
        key='deselect-page'
      >{t`Deselect page (${repositoryList.length} items)`}</DropdownItem>,
      <DropdownItem
        onClick={deselectAll}
        key='deselect-all'
      >{t`Deselect all (${selectedRepos.length} items)`}</DropdownItem>,
    ];

    return (
      <Dropdown
        onSelect={onSelect}
        toggle={
          <DropdownToggle
            splitButtonItems={[
              <DropdownToggleCheckbox
                id='split-button-toggle-checkbox'
                key='split-checkbox'
                aria-label={t`Select page`}
                checked={isSelectorChecked}
                onChange={onToggleCheckbox}
              />,
            ]}
            onToggle={onToggle}
            id='toggle-split-button'
          />
        }
        isOpen={isSelectorOpen}
        dropdownItems={dropdownItems}
      />
    );
  }

  function renderTable() {
    const sortTableOptions = {
      headers: [
        {
          title: '',
          type: 'none',
          id: 'expander',
        },
        {
          title: t`Name`,
          type: 'alpha',
          id: 'name',
        },
        {
          title: t`Description`,
          type: 'none',
          id: 'description',
        },
      ],
    };

    return (
      <table
        aria-label={t`Repositories`}
        className='hub-c-table-content pf-c-table'
      >
        <SortTable
          options={sortTableOptions}
          params={params}
          updateParams={(p) => setParams(p)}
        />
        {repositoryList.map((repo, i) =>
          props.singleSelectionOnly ? (
            <RadioRow
              rowIndex={i}
              key={repo.name}
              isSelected={
                selectedRepos.includes(repo.name) ||
                disabledRepos.includes(repo.name)
              }
              onSelect={() => setSelection(repo)}
              isDisabled={disabledRepos.includes(repo.name)}
              data-cy={`ApproveModal-RadioRow-row-${repo.name}`}
            >
              <td>{repo.name}</td>
              <td>{repo.description}</td>
            </RadioRow>
          ) : (
            <CheckboxRow
              rowIndex={i}
              key={repo.name}
              isSelected={
                selectedRepos.includes(repo.name) ||
                disabledRepos.includes(repo.name)
              }
              onSelect={() => changeSelection(repo)}
              isDisabled={disabledRepos.includes(repo.name)}
              data-cy={`ApproveModal-CheckboxRow-row-${repo.name}`}
            >
              <td>{repo.name}</td>
              <td>{repo.description}</td>
            </CheckboxRow>
          ),
        )}
      </table>
    );
  }

  return (
    <>
      {renderLabels()}
      <div className='hub-toolbar'>
        <Toolbar>
          <ToolbarGroup>
            {!props.singleSelectionOnly && (
              <ToolbarItem>{renderMultipleSelector()}</ToolbarItem>
            )}
            <ToolbarItem>
              <CompoundFilter
                inputText={inputText}
                onChange={(text) => {
                  setInputText(text);
                }}
                updateParams={(p) => setParams(p)}
                params={params}
                filterConfig={[
                  {
                    id: 'name__icontains',
                    title: t`Repository`,
                  },
                ]}
              />
            </ToolbarItem>
          </ToolbarGroup>
        </Toolbar>

        <Pagination
          params={params}
          updateParams={(p) => setParams(p)}
          count={itemsCount}
          isTop
        />
      </div>
      <div>
        <AppliedFilters
          updateParams={(p) => {
            setParams(p);
            setInputText('');
          }}
          params={params}
          ignoredParams={['page_size', 'page', 'sort']}
          niceNames={{
            name__icontains: t`Name`,
          }}
        />
      </div>

      {loading ? <Spinner size='lg' /> : renderTable()}

      <div className='footer'>
        <Pagination
          params={params}
          updateParams={(p) => setParams(p)}
          count={itemsCount}
        />
      </div>
    </>
  );
};
