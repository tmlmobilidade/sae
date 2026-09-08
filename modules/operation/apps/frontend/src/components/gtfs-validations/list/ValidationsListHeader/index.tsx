/* * */

import { openCreateValidationModal } from '@/components/gtfs-validations/create/ValidationCreate.modal';
import { ValidationsListFilterSearch } from '@/components/gtfs-validations/list/filters/ValidationsListFilterSearch';
import { IconPlus } from '@tabler/icons-react';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { Button, HasPermission, Label, Spacer, Toolbar } from '@tmlmobilidade/ui';

/* * */

export function ValidationsListHeader() {
	//

	//
	// A. Setup variables

	//
	// B. Render components

	return (
		<Toolbar>
			<Label size="lg" caps singleLine>Validações GTFS</Label>
			<Spacer />
			<ValidationsListFilterSearch />
			<HasPermission action={PermissionCatalog.all.gtfs_validations.actions.create} scope={PermissionCatalog.all.gtfs_validations.scope}>
				<Button label="Nova validação" leftSection={<IconPlus />} onClick={openCreateValidationModal} />
			</HasPermission>
		</Toolbar>
	);

	//
}
