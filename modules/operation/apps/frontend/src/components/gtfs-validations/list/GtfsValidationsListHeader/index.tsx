/* * */

import { openCreateValidationModal } from '@/components/gtfs-validations/create/ValidationCreate.modal';
import { ValidationsListFilterSearch } from '@/components/gtfs-validations/list/filters/ValidationsListFilterSearch';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { CreateButton, HasPermission, Label, Spacer, Toolbar } from '@tmlmobilidade/ui';

/* * */

export function GtfsValidationsListHeader() {
	return (
		<Toolbar>
			<Label size="lg" caps singleLine>Validações GTFS</Label>
			<Spacer />
			<ValidationsListFilterSearch />
			<HasPermission action={PermissionCatalog.all.gtfs_validations.actions.create} scope={PermissionCatalog.all.gtfs_validations.scope}>
				<CreateButton onClick={openCreateValidationModal} />
			</HasPermission>
		</Toolbar>
	);
}
