import { useAlertListContext } from '@/contexts/AlertList.context';
import { useLinesContext } from '@/contexts/Lines.context';
import { useLocationsContext } from '@/contexts/Locations.context';
import { useStopsContext } from '@/contexts/Stops.context';
import { AlertSchema } from '@tmlmobilidade/core-types';
import { Badge, Checkbox, DateTimePicker, Menu, Surface, Text } from '@tmlmobilidade/ui';
import { ViewportList } from 'react-viewport-list';

import styles from './styles.module.css';

export default function Filters() {
	return (
		<Surface alignItems="center" classNames={styles} flexDirection="row" gap="lg" padding="sm">
			<Text className={styles.title} size="sm" weight="medium">Filtrar por:</Text>
			<div className={styles.filters}>
				<StateFilter />
				<CauseFilter />
				<EffectFilter />
				<MunicipalityFilter />
				<LineFilter />
				<StopFilter />
				<PublishDateFilter />
				<ValidityDateFilter />
			</div>
		</Surface>
	);
}

function StateFilter() {
	const { actions, filters } = useAlertListContext();
	const hasChanged = AlertSchema.shape.publish_status.options.length !== filters.publish_status.length;

	return (
		<Menu trigger="click-hover" withArrow>
			<Menu.Target>
				<Badge p="xs" type="pill" variant={hasChanged ? 'primary' : 'muted'}>
					<Text className={styles.filterTitle} size="sm" weight="medium">Estado</Text>
				</Badge>
			</Menu.Target>
			<Menu.Dropdown classNames={{ dropdown: styles.dropdown }}>
				{AlertSchema.shape.publish_status.options.map(status => (
					<Menu.Item key={status} closeMenuOnClick={false} p="sm">
						<div className={styles.filterItem} onClick={() => actions.togglePublishStatus(status)}>
							<Checkbox checked={filters.publish_status.includes(status)} />
							<Text className={styles.filterTitle} size="sm" weight="medium">{status}</Text>
						</div>
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}

function CauseFilter() {
	const { actions, filters } = useAlertListContext();
	const hasChanged = AlertSchema.shape.cause.options.length !== filters.cause.length;

	return (
		<Menu trigger="click-hover" withArrow>
			<Menu.Target>
				<Badge p="xs" type="pill" variant={hasChanged ? 'primary' : 'muted'}>
					<Text className={styles.filterTitle} size="sm" weight="medium">Causa</Text>
				</Badge>
			</Menu.Target>
			<Menu.Dropdown classNames={{ dropdown: styles.dropdown }}>
				{AlertSchema.shape.cause.options.map(cause => (
					<Menu.Item key={cause} closeMenuOnClick={false} p="sm">
						<div className={styles.filterItem} onClick={() => actions.toggleCause(cause)}>
							<Checkbox checked={filters.cause.includes(cause)} />
							<Text className={styles.filterTitle} size="sm" weight="medium">{cause}</Text>
						</div>
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}

function EffectFilter() {
	const { actions, filters } = useAlertListContext();
	const hasChanged = AlertSchema.shape.effect.options.length !== filters.effect.length;

	return (
		<Menu trigger="click-hover" withArrow>
			<Menu.Target>
				<Badge p="xs" type="pill" variant={hasChanged ? 'primary' : 'muted'}>
					<Text className={styles.filterTitle} size="sm" weight="medium">Efeito</Text>
				</Badge>
			</Menu.Target>
			<Menu.Dropdown classNames={{ dropdown: styles.dropdown }}>
				{AlertSchema.shape.effect.options.map(effect => (
					<div key={effect} onClick={() => actions.toggleEffect(effect)}>
						<Menu.Item closeMenuOnClick={false} p="sm">
							<div className={styles.filterItem}>
								<Checkbox checked={filters.effect.includes(effect)} />
								<Text className={styles.filterTitle} size="sm" weight="medium">{effect}</Text>
							</div>
						</Menu.Item>
					</div>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}

function MunicipalityFilter() {
	const { actions, filters } = useAlertListContext();
	const { data: { municipalities } } = useLocationsContext();

	const parseMunicipality = (id: string) => {
		const municipality = municipalities.find(m => m.id === id);
		return municipality ? municipality.name : '';
	};

	const hasChanged = filters.municipality.length !== filters.municipalityOptions.length;

	return (
		<Menu trigger="click-hover" withArrow>
			<Menu.Target>
				<Badge p="xs" type="pill" variant={hasChanged ? 'primary' : 'muted'}>
					<Text className={styles.filterTitle} size="sm" weight="medium">Municípios</Text>
				</Badge>
			</Menu.Target>
			<Menu.Dropdown classNames={{ dropdown: styles.dropdown }}>
				{filters.municipalityOptions.map(municipality => (
					<div key={municipality} onClick={() => actions.toggleMunicipality(municipality)}>
						<Menu.Item closeMenuOnClick={false} p="sm">
							<div className={styles.filterItem}>
								<Checkbox checked={filters.municipality.includes(municipality)} />
								<Text className={styles.filterTitle} size="sm" weight="medium">{parseMunicipality(municipality)}</Text>
							</div>
						</Menu.Item>
					</div>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}

function LineFilter() {
	const { actions, filters } = useAlertListContext();
	const { data: { lines, routes } } = useLinesContext();

	const parseLine = (route_id: string) => {
		const route = routes.find(r => r.id === route_id);
		return `[${route?.line_id}] - ${lines.find(l => l.id === route?.line_id)?.long_name ?? ''}`;
	};

	const hasChanged = filters.line.length !== filters.lineOptions.length;

	return (
		<Menu trigger="click-hover" withArrow>
			<Menu.Target>
				<Badge p="xs" type="pill" variant={hasChanged ? 'primary' : 'muted'}>
					<Text className={styles.filterTitle} size="sm" weight="medium">Linhas</Text>
				</Badge>
			</Menu.Target>
			<Menu.Dropdown classNames={{ dropdown: styles.lineDropdown }}>
				<ViewportList items={filters.lineOptions}>
					{route_id => (
						<div key={route_id} onClick={() => actions.toggleLine(route_id)}>
							<Menu.Item closeMenuOnClick={false} p="sm">
								<div className={styles.filterItem}>
									<Checkbox checked={filters.line.includes(route_id)} />
									<Text className={styles.filterTitle} size="sm" weight="medium">{parseLine(route_id)}</Text>
								</div>
							</Menu.Item>
						</div>
					)}
				</ViewportList>
			</Menu.Dropdown>
		</Menu>
	);
}

function StopFilter() {
	const { actions, filters } = useAlertListContext();
	const { data: { stops } } = useStopsContext();

	const parseStop = (stop_id: string) => {
		const stop = stops.find(s => s.id === stop_id);
		return `[${stop?.id}] - ${stop?.long_name ?? ''}`;
	};

	const hasChanged = filters.stop.length !== filters.stopOptions.length;

	return (
		<Menu trigger="click-hover" withArrow>
			<Menu.Target>
				<Badge p="sm" type="pill" variant={hasChanged ? 'primary' : 'muted'}>
					<Text className={styles.filterTitle} size="sm" weight="medium">Paragens</Text>
				</Badge>
			</Menu.Target>
			<Menu.Dropdown classNames={{ dropdown: styles.stopDropdown }}>
				<ViewportList items={filters.stopOptions}>
					{stop_id => (
						<div key={stop_id} onClick={() => actions.toggleStop(stop_id)}>
							<Menu.Item closeMenuOnClick={false} p="sm">
								<div className={styles.filterItem}>
									<Checkbox checked={filters.stop.includes(stop_id)} />
									<Text className={styles.filterTitle} size="sm" weight="medium">{parseStop(stop_id)}</Text>
								</div>
							</Menu.Item>
						</div>
					)}
				</ViewportList>
			</Menu.Dropdown>
		</Menu>
	);
}

function PublishDateFilter() {
	const { actions, filters } = useAlertListContext();

	const hasChanged = filters.publishDateStart || filters.publishDateEnd;

	return (
		<Menu closeOnClickOutside={false} trigger="click-hover" withArrow>
			<Menu.Target>
				<Badge p="sm" type="pill" variant={hasChanged ? 'primary' : 'muted'}>
					<Text className={styles.filterTitle} size="sm" weight="medium">Visibilidade</Text>
				</Badge>
			</Menu.Target>
			<Menu.Dropdown classNames={{ dropdown: styles.dropdown }}>
				<Text className={styles.filterDescription} size="sm" weight="medium">Datas em que o alerta é visível nos canais digitais, não necessariamente a data de que é valido (Periodo de vigência)</Text>
				<div className={styles.filterItem}>
					<DateTimePicker description="Data de início da visibilidade do alerta" flex={1} label="Data de início" onChange={actions.changePublishDateStart} value={filters.publishDateStart} clearable />
					<DateTimePicker description="Data de fim da visibilidade do alerta" flex={1} label="Data de fim" onChange={actions.changePublishDateEnd} value={filters.publishDateEnd} clearable />
				</div>
			</Menu.Dropdown>
		</Menu>
	);
}

function ValidityDateFilter() {
	const { actions, filters } = useAlertListContext();

	const hasChanged = filters.validityDateStart || filters.validityDateEnd;

	return (
		<Menu closeOnClickOutside={false} trigger="click-hover" withArrow>
			<Menu.Target>
				<Badge p="sm" type="pill" variant={hasChanged ? 'primary' : 'muted'}>
					<Text className={styles.filterTitle} size="sm" weight="medium">Vigência</Text>
				</Badge>
			</Menu.Target>
			<Menu.Dropdown classNames={{ dropdown: styles.dropdown }}>
				<Text className={styles.filterDescription} size="sm" weight="medium">Datas em que o alerta é válido</Text>
				<div className={styles.filterItem}>
					<DateTimePicker description="Data de início da validade do alerta" flex={1} label="Data de início" onChange={actions.changeValidityDateStart} value={filters.validityDateStart} clearable />
					<DateTimePicker description="Data de fim da validade do alerta" flex={1} label="Data de fim" onChange={actions.changeValidityDateEnd} value={filters.validityDateEnd} clearable />
				</div>
			</Menu.Dropdown>
		</Menu>
	);
}
