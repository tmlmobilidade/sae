'use client';

/* * */

import { useRoutesData } from '@/components/lines/use-routes-data';
import { useStopsData } from '@/components/stops/use-stops-data';
import { formatStopLocation } from '@/utils/transit/format-stop-location';
import { ComboboxItem, ComboboxItemGroup, Flex, Group, Select, SelectProps, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { type HubPattern } from '@tmlmobilidade/go-types-hub';
import { type OperationalDateInt } from '@tmlmobilidade/go-types-shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/* * */

export interface Props extends SelectProps {
	date_filter?: OperationalDateInt
	patterns: HubPattern[]
}

interface CustomComboboxItem extends ComboboxItem {
	direction_id: number
	pattern_id: string
}

const PLACEHOLDER_HEADSIGN = 'HeadSign to be defined';

function getPatternTitle(pattern: HubPattern, routeLongName?: string) {
	if (pattern.headsign && pattern.headsign !== PLACEHOLDER_HEADSIGN) {
		return pattern.headsign;
	}

	return pattern.long_name || routeLongName || pattern.headsign;
}

/* * */

export function SelectPattern({ date_filter, onChange, patterns, value, ...props }: Props) {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const { data: routes } = useRoutesData();
	const { data: stops } = useStopsData();

	//
	// B. Transform data

	const patternsForSelect = useMemo(() => {
		if (!patterns) return [];

		const withPath = patterns.filter(pattern => pattern.path.length > 0);
		const base = withPath.length > 0 ? withPath : patterns;
		const selected = value ? patterns.find(pattern => pattern.version_id === value) : undefined;

		if (selected && !base.some(pattern => pattern.version_id === value)) {
			return [...base, selected];
		}

		return base;
	}, [patterns, value]);

	const validPatternsSelectOptions = useMemo(() => {
		if (!patternsForSelect.length) return [];

		let data: ComboboxItemGroup<CustomComboboxItem>[] = [];

		// Filter patterns by date
		patternsForSelect.map((patternGroupData) => {
			const group = data.find(group => group.group === patternGroupData.route_id);
			const routeData = routes.find(route => route._id === patternGroupData.route_id);

			const item = {
				direction_id: patternGroupData.direction_id,
				disabled: (date_filter ? !patternGroupData.valid_on.includes(date_filter) : false) || !patternGroupData.path.length,
				label: t('default:lines.SelectPattern.destination', '', { destination: getPatternTitle(patternGroupData, routeData?.long_name) }),
				pattern_id: patternGroupData._id,
				value: patternGroupData.version_id,
			};

			if (group) {
				group.items.push(item);
			} else {
				data.push({
					group: patternGroupData.route_id,
					items: [item],
				});
			}
		});

		data.forEach(group => group.items.sort((a, b) => a.direction_id - b.direction_id));

		// data.sort((a, b) => a.group.localeCompare(b.group));

		data = data.map((group, index) => {
			const routeData = routes.find(route => route._id === group.group);
			const letterIndex = String.fromCharCode(65 + index);
			return ({ ...group, group: `${letterIndex} | ${routeData?.long_name}` });
		});

		return data;
	}, [date_filter, patternsForSelect, routes, t]);

	//
	// C. Render components

	const renderSelectOption: SelectProps['renderOption'] = ({ option }: { option: CustomComboboxItem }) => {
		//

		const patternData = patternsForSelect.find(pattern => pattern.version_id === option.value);
		if (!patternData?.path.length) {
			return (
				<Flex align="center" gap={5} justify="center">
					<IconAlertTriangle size={14} />
					<Text size="xs">{t('default:lines.SelectPattern.invalid_option_label', '', { message: t('default:lines.SelectPattern.invalid_option', '', { pattern_id: option.pattern_id }) })}</Text>
				</Flex>
			);
		};

		const firstStopData = stops.find(stop => String(stop._id) === String(patternData.path[0].stop_id));
		const firstStopLocation = formatStopLocation(firstStopData?.locality_name, firstStopData?.municipality_name);

		const routeData = routes.find(route => route._id === patternData.route_id);

		return (
			<Group key={option.value} gap={2}>
				<Flex direction="column">
					<Flex align="flex-end" gap={5}>
						<Text fw="bold">{getPatternTitle(patternData, routeData?.long_name)}</Text>
					</Flex>
					<Text size="xs">{t('default:lines.SelectPattern.option_label', '', { locality: firstStopLocation || '' })}</Text>
				</Flex>
			</Group>
		);
	};

	return (
		<Select
			allowDeselect={false}
			data={validPatternsSelectOptions}
			// description={selectDescription}
			// label={t('default:lines.SelectPattern.label')}
			onChange={onChange}
			placeholder={t('default:lines.SelectPattern.placeholder')}
			renderOption={renderSelectOption}
			value={value}
			w="100%"
			{...props}
		/>
	);
}
