'use client';

import { useAlertListContext } from '@/contexts/AlertList.context';
import { useLocationsContext } from '@/contexts/Locations.context';
import { Alert } from '@tmlmobilidade/core-types';
import { Badge, DataTable, DataTableColumn } from '@tmlmobilidade/ui';

export default function AlertList() {
	const { data, flags, actions } = useAlertListContext();
    const { data: { municipalities } } = useLocationsContext();

    if(flags.isLoading) {
        return <div>Loading...</div>;
    } else if(flags.error) {
        return <div>Error: {flags.error.message}</div>;
    }

    const columns : DataTableColumn<Alert>[] = [
        { accessor: 'state', title: 'Estado', render: ({publish_status}) => <Badge>{publish_status}</Badge> },
        { accessor: 'title', title: 'Título'},
        { accessor: 'municipality', title: 'Municípios', render: ({municipality_ids}) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-spacing-xs)' }}>
                {municipality_ids.slice(0, 2).map((municipality) => (
                    <Badge key={municipality} variant='muted'>
                        {municipalities.find((m) => m.id === municipality)?.name}
                    </Badge>
                ))}
                </div>
                {municipality_ids.length > 2 && (
                    <span>+{municipality_ids.length - 2}</span>
                )}
            </div>
        )},
    ];

	return (
		<div>
			<DataTable
                records={data.filtered}
                columns={columns}
            />
		</div>
	);
}
