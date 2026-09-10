'use client';

import { ImportPreview } from '@/components/common/ImportPreview';
import { useVehicleImportContext } from '@/contexts/VehicleImport.context';
import { AlertMessage, Button, closeModal, Divider, FileUpload, Grid, Label, Section } from '@tmlmobilidade/ui';

/* * */

export function VehicleImportFile() {
	//

	//
	// A. Setup variables

	const vehicleImportContext = useVehicleImportContext();

	//
	// B. Render Components

	return (
		<Section gap="lg">

			{vehicleImportContext.flags.error != null && (
				<>
					<AlertMessage title={vehicleImportContext.flags.error?.message ?? 'Erro desconhecido.'} variant="danger" />
					<Divider />
				</>
			)}

			{vehicleImportContext.data.importPreview && vehicleImportContext.actions.setImportFile && (
				<>
					<ImportPreview />
				</>
			)}

			<Label>Selecione um arquivo valido para criar ou atualizar um veículo</Label>
			<FileUpload
				accept=".txt"
				label="Arquivo de importação de veículos"
				maxFileSize={5 * 1024 * 1024 * 1024} // 5 GB
				onFileChange={vehicleImportContext.actions.setImportFile}
			/>

			<Section>
				<Grid columns="ab" gap="md">
					<Button
						disabled={vehicleImportContext?.flags.isloading}
						label="Cancelar"
						onClick={() => closeModal('import-vehicle-modal')}
						variant="secondary"
					/>
					<Button
						disabled={vehicleImportContext?.flags.error != null}
						label="Criar veículos"
						loading={vehicleImportContext?.flags.isloading}
						onClick={vehicleImportContext?.actions.createVehicle}
					/>
				</Grid>
			</Section>

		</Section>

	);
}
