import { Badge, Checkbox, DateTimePicker, Menu, Surface, Text} from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import { useAlertListContext } from '@/contexts/AlertList.context';
import { useState } from 'react';
import { AlertSchema } from '@tmlmobilidade/core-types';
import { useLocationsContext } from '@/contexts/Locations.context';
import { useMemo } from 'react';
import { useLinesContext } from '@/contexts/Lines.context';
import { useStopsContext } from '@/contexts/Stops.context';

export default function Filters() {
	return <Surface padding="sm" classNames={styles} flexDirection='row' gap='lg' alignItems='center'>
        <Text size='sm' weight='medium' className={styles.title}>Filtrar por:</Text>
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
    </Surface>;
}

function StateFilter() {
    
    const {filters, actions } = useAlertListContext();
    const hasChanged = AlertSchema.shape.publish_status.options.length !== filters.publish_status.length;

    return (
        <Menu withArrow trigger='click-hover'>
            <Menu.Target>
                <Badge p='xs' type='pill' variant={hasChanged ? 'primary' : 'muted'}>
                    <Text size='sm' weight='medium' className={styles.filterTitle}>Estado</Text>
                </Badge>
            </Menu.Target>
            <Menu.Dropdown classNames={{dropdown: styles.dropdown}}>
               {AlertSchema.shape.publish_status.options.map((status) => (
                    <Menu.Item key={status} p='sm' closeMenuOnClick={false}>
                        <div className={styles.filterItem} onClick={() => actions.togglePublishStatus(status)}>
                            <Checkbox checked={filters.publish_status.includes(status)}/>
                            <Text size='sm' weight='medium' className={styles.filterTitle}>{status}</Text>
                        </div>
                    </Menu.Item>
               ))}
            </Menu.Dropdown>
        </Menu>
    )
}

function CauseFilter() {
    
    const {filters, actions  } = useAlertListContext();
    const hasChanged = AlertSchema.shape.cause.options.length !== filters.cause.length;

    return (
        <Menu withArrow trigger='click-hover'>
            <Menu.Target>
                <Badge p='xs' type='pill' variant={hasChanged ? 'primary' : 'muted'}>
                    <Text size='sm' weight='medium' className={styles.filterTitle}>Causa</Text>
                </Badge>
            </Menu.Target>
            <Menu.Dropdown classNames={{dropdown: styles.dropdown}}>
               {AlertSchema.shape.cause.options.map((cause) => (
                    <Menu.Item key={cause} p='sm' closeMenuOnClick={false}>
                        <div className={styles.filterItem} onClick={() => actions.toggleCause(cause)}>
                            <Checkbox checked={filters.cause.includes(cause)}/>
                            <Text size='sm' weight='medium' className={styles.filterTitle}>{cause}</Text>
                        </div>
                    </Menu.Item>
               ))}
            </Menu.Dropdown>
        </Menu>
    )
}

function EffectFilter() {
    
    const {filters, actions  } = useAlertListContext();
    const hasChanged = AlertSchema.shape.effect.options.length !== filters.effect.length;

    return (
        <Menu withArrow trigger='click-hover'>
            <Menu.Target>
                <Badge p='xs' type='pill' variant={hasChanged ? 'primary' : 'muted'}>
                    <Text size='sm' weight='medium' className={styles.filterTitle}>Efeito</Text>
                </Badge>
            </Menu.Target>
            <Menu.Dropdown classNames={{dropdown: styles.dropdown}}>
               {AlertSchema.shape.effect.options.map((effect) => (
                    <div key={effect} onClick={() => actions.toggleEffect(effect)}>
                        <Menu.Item p='sm' closeMenuOnClick={false}>
                            <div className={styles.filterItem}>
                                <Checkbox checked={filters.effect.includes(effect)} onChange={() => {}}/>
                                <Text size='sm' weight='medium' className={styles.filterTitle}>{effect}</Text>
                            </div>
                        </Menu.Item>
                    </div>
               ))}
            </Menu.Dropdown>
        </Menu>
    )
}

function MunicipalityFilter() {
    
    const {filters, actions } = useAlertListContext();
    const { data : {municipalities} } = useLocationsContext();

    const parseMunicipality = (id: string) => {
        const municipality = municipalities.find((m) => m.id === id);
        return municipality ? municipality.name : '';
    }
    
    const hasChanged = filters.municipality.length !== filters.municipalityOptions.length;

    return (
        <Menu withArrow trigger='click-hover'>
            <Menu.Target>
                <Badge p='xs' type='pill' variant={hasChanged ? 'primary' : 'muted'}>
                    <Text size='sm' weight='medium' className={styles.filterTitle}>Municípios</Text>
                </Badge>
            </Menu.Target>
            <Menu.Dropdown classNames={{dropdown: styles.dropdown}}>
               {filters.municipalityOptions.map((municipality) => (
                    <div key={municipality} onClick={() => actions.toggleMunicipality(municipality)}>
                        <Menu.Item p='sm' closeMenuOnClick={false}>
                            <div className={styles.filterItem}>
                                <Checkbox checked={filters.municipality.includes(municipality)} onChange={() => {}}/>
                                <Text size='sm' weight='medium' className={styles.filterTitle}>{parseMunicipality(municipality)}</Text>
                            </div>
                        </Menu.Item>
                    </div>
               ))}
            </Menu.Dropdown>
        </Menu>
    )
}

function LineFilter() {
    
    const {filters, actions } = useAlertListContext();
    const { data : {routes, lines} } = useLinesContext();

    const parseLine = (route_id: string) => {
        const route = routes.find((r) => r.id === route_id);
        return `[${route?.line_id}] - ${lines.find((l) => l.id === route?.line_id)?.long_name ?? ''}`;
    }
    
    const hasChanged = filters.line.length !== filters.lineOptions.length;

    return (
        <Menu withArrow trigger='click-hover'>
            <Menu.Target>
                <Badge p='xs' type='pill' variant={hasChanged ? 'primary' : 'muted'}>
                    <Text size='sm' weight='medium' className={styles.filterTitle}>Linhas</Text>
                </Badge>
            </Menu.Target>
            <Menu.Dropdown classNames={{dropdown: styles.dropdown}}>
               {filters.lineOptions.map((route_id) => (
                    <div key={route_id} onClick={() => actions.toggleLine(route_id)}>
                        <Menu.Item p='sm' closeMenuOnClick={false}>
                            <div className={styles.filterItem}>
                                <Checkbox checked={filters.line.includes(route_id)} onChange={() => {}}/>
                                <Text size='sm' weight='medium' className={styles.filterTitle}>{parseLine(route_id)}</Text>
                            </div>
                        </Menu.Item>
                    </div>
               ))}
            </Menu.Dropdown>
        </Menu>
    )
}

function StopFilter() {
    
    const {filters, actions } = useAlertListContext();
    const { data : {stops} } = useStopsContext();

    const parseStop = (stop_id: string) => {
        const stop = stops.find((s) => s.id === stop_id);
        return `[${stop?.id}] - ${stop?.long_name ?? ''}`;
    }
    
    const hasChanged = filters.stop.length !== filters.stopOptions.length;

    return (
        <Menu withArrow trigger='click-hover'>
            <Menu.Target>
                <Badge p="sm" type='pill' variant={hasChanged ? 'primary' : 'muted'}>
                    <Text size='sm' weight='medium' className={styles.filterTitle}>Paragens</Text>
                </Badge>
            </Menu.Target>
            <Menu.Dropdown classNames={{dropdown: styles.dropdown}}>
               {filters.stopOptions.map((stop_id) => (
                    <div key={stop_id} onClick={() => actions.toggleStop(stop_id)}>
                        <Menu.Item p='sm' closeMenuOnClick={false}>
                            <div className={styles.filterItem}>
                                <Checkbox checked={filters.stop.includes(stop_id)} onChange={() => {}}/>
                                <Text size='sm' weight='medium' className={styles.filterTitle}>{parseStop(stop_id)}</Text>
                            </div>
                        </Menu.Item>
                    </div>
               ))}
            </Menu.Dropdown>
        </Menu>
    )
}

function PublishDateFilter() {
    
    const {filters, actions} = useAlertListContext();

    
    const hasChanged = filters.publishDateStart || filters.publishDateEnd;

    return (
        <Menu withArrow trigger='click-hover' closeOnClickOutside={false}>
            <Menu.Target>
                <Badge p="sm" type='pill' variant={hasChanged ? 'primary' : 'muted'}>
                    <Text size='sm' weight='medium' className={styles.filterTitle}>Visibilidade</Text>
                </Badge>
            </Menu.Target>
            <Menu.Dropdown classNames={{dropdown: styles.dropdown}}>
                <Text size='sm' weight='medium' className={styles.filterDescription}>Datas em que o alerta é visível nos canais digitais, não necessariamente a data de que é valido (Periodo de vigência)</Text>
                <div className={styles.filterItem}>
                    <DateTimePicker clearable value={filters.publishDateStart} label='Data de início' flex={1} description='Data de início da visibilidade do alerta' onChange={actions.changePublishDateStart}/>
                    <DateTimePicker clearable value={filters.publishDateEnd} label='Data de fim' flex={1} description='Data de fim da visibilidade do alerta' onChange={actions.changePublishDateEnd}/>
                </div>
            </Menu.Dropdown>
        </Menu>
    )
}

function ValidityDateFilter() {
    
    const {filters, actions} = useAlertListContext();

    
    const hasChanged = filters.validityDateStart || filters.validityDateEnd;

    return (
        <Menu withArrow trigger='click-hover' closeOnClickOutside={false}>
            <Menu.Target>
                <Badge p="sm" type='pill' variant={hasChanged ? 'primary' : 'muted'}>
                    <Text size='sm' weight='medium' className={styles.filterTitle}>Vigência</Text>
                </Badge>
            </Menu.Target>
            <Menu.Dropdown classNames={{dropdown: styles.dropdown}}>
                <Text size='sm' weight='medium' className={styles.filterDescription}>Datas em que o alerta é válido</Text>
                <div className={styles.filterItem}>
                    <DateTimePicker clearable value={filters.validityDateStart} label='Data de início' flex={1} description='Data de início da validade do alerta' onChange={actions.changeValidityDateStart}/>
                    <DateTimePicker clearable value={filters.validityDateEnd} label='Data de fim' flex={1} description='Data de fim da validade do alerta' onChange={actions.changeValidityDateEnd}/>
                </div>
            </Menu.Dropdown>
        </Menu>
    )
}