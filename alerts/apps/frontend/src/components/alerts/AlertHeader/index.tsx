'use client';

import { deleteAlert } from '@/actions/alerts';
import { Permissions } from '@/components/authentication/Permissions';
import AutoSave from '@/components/common/AutoSave/AutoSave';
import DeleteButton from '@/components/common/DeleteButton';
import { useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { useAlertsListContext } from '@/components/context/AlertList.context';
import { Surface } from '@/components/layout/Surface';
import toast from '@/utils/toast';
import { useRouter } from 'next/navigation';

import styles from './styles.module.css';

export default function AlertHeader() {
	const alertDetailContext = useAlertDetailContext();
	const alertsListContext = useAlertsListContext();
	const router = useRouter();

	async function handleDelete() {
		try {
			await deleteAlert(alertDetailContext.data.id);
			toast.success({ message: 'Alerta apagado com sucesso' });
			router.refresh();
		}
		catch (error) {
			console.error(error);
			toast.error({ message: 'Erro ao apagar alerta' });
		}
	}

	return (
		<div className={styles.container}>
			<Surface className={styles.surface} padding="lg">
				<div className={styles.left}>
					<AutoSave
						closeType="close"
						isDirty={alertDetailContext.data.form.isDirty()}
						isErrorSaving={null}
						isErrorValidating={null}
						isLoading={false}
						isSaving={alertDetailContext.flags.isSaving}
						isValid={alertDetailContext.data.form.isValid()}
						onClose={() => alertsListContext.actions.setSelected(null)}
						onSave={alertDetailContext.actions.saveAlert}
					/>
					{alertDetailContext.data.id}
				</div>
				<Permissions action="delete" scope="alerts">
					<DeleteButton onClick={handleDelete} />
				</Permissions>
			</Surface>
		</div>
	);
}
