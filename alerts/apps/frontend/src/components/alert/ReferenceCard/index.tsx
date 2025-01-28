import { Button, Combobox, Surface } from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import { IconCornerDownRight, IconTrash } from '@tabler/icons-react';

interface ReferenceCardProps {
	onDelete?: () => void;
}

export default function ReferenceCard({ onDelete }: ReferenceCardProps) {
	return (
		<Surface padding="sm" gap="md" borderRadius="sm" classNames={styles}>
				<Combobox
					label="Linha Afetada"
					data={['1701_0_1', '1701_0_2', '1701_0_3']}
					searchable
					aria-label="Linha Afetada"
                    fullWidth
				/>
			<div className={styles.childrenWrapper}>
				<IconCornerDownRight size={28} className={styles.icon} />
				<div className={styles.comboboxWrapper}>
					<Combobox
						label="Paragens Afetadas"
						description="Selecione as paragens que serão afetadas pelo alerta"
						data={['Paragem 1', 'Paragem 2', 'Paragem 3']}
						multiple
						searchable
						clearable
						fullWidth
						aria-label="Paragens Afetadas"
					/>
				</div>
			</div>
			<div className={styles.buttonContainer}>
				<Button
					variant="danger"
					className={styles.button}
					onClick={onDelete}
				>
					<IconTrash size={18} />
					<div>Eliminar</div>
				</Button>
			</div>
		</Surface>
	);
}
