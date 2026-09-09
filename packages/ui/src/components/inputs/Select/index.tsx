'use client';

import { Select as MantineSelect, type SelectProps as MantineSelectProps } from '@mantine/core';

export type { ComboboxItem, ComboboxItemGroup } from '@mantine/core';

/* * */

export interface SelectDataItem {
	checked?: boolean
	disabled?: boolean
	label: string
	value: string
};

/* * */

export interface SelectProps extends MantineSelectProps {

	/**
	 * The data items to be displayed in the Select component.
	 * Supports Mantine's grouped options as well as `SelectDataItem` values.
	 */
	data?: MantineSelectProps['data']

};

/**
 * Renders a Select component with customized default props.
 */
export function Select(props: SelectProps) {
	return (
		<MantineSelect
			allowDeselect={props.clearable ?? true}
			clearable={props.clearable ?? true}
			limit={25}
			nothingFoundMessage={props.nothingFoundMessage || 'Nenhum resultado encontrado'}
			placeholder="Selecione uma opção..."
			searchable
			withAlignedLabels
			{...props}
		/>
	);
}
