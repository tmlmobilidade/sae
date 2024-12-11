'use client';

import { deleteAlert } from '@/actions/alerts';
import { Permissions } from '@/components/authentication/Permissions';
import CloseButton from '@/components/common/CloseButton';
import DeleteButton from '@/components/common/DeleteButton';
import { useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { useAlertsListContext } from '@/components/context/AlertList.context';
import { Surface } from '@/components/layout/Surface';
import toast from '@/utils/toast';
import { useRouter } from 'next/navigation';

import styles from './styles.module.css';

export default function AlertHeader() {
	const { data } = useAlertDetailContext();
	const { actions } = useAlertsListContext();
	const router = useRouter();

	async function handleDelete() {
		try {
			await deleteAlert(data.id);
			toast.success({ message: 'Alerta apagado com sucesso' });
			router.refresh();
		}
		catch (error) {
			console.error(error);
			toast.error({ message: 'Erro ao apagar alerta' });
		}
	}

	return (
		<Surface className={styles.surface} padding="lg">
			<div className={styles.left}>
				<CloseButton onClick={() => actions.setSelected(null)} />
				{data.id}
			</div>
			<Permissions action="delete" scope="alerts">
				<DeleteButton onClick={handleDelete} />
			</Permissions>
		</Surface>
	);
}
