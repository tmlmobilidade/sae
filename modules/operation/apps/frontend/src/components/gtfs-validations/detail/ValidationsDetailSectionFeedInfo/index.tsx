/* * */

import { FeedInfoDisplay } from '@/components/common/FeedInfoDisplay';
import { useValidationsDetailContext } from '@/components/gtfs-validations/detail/ValidationsDetailForm.context';
import { API_ROUTES } from '@tmlmobilidade/consts';
import { Collapsible, FileItem, Label, Section, useToast } from '@tmlmobilidade/ui';

/* * */

export function ValidationsDetailSectionFeedInfo() {
	//

	//
	// A. Setup variables

	const validationsDetailContext = useValidationsDetailContext();

	//
	// B. Handle actions

	const handleDownload = async () => {
		try {
			// Open file.url in a new window
			window.open(API_ROUTES.operation.GTFS_VALIDATIONS_DETAIL_FILE_DOWNLOAD(validationsDetailContext.data.validation?._id), '_blank');
		} catch (error) {
			useToast.error({
				message: error instanceof Error ? error.message : 'Erro ao transferir ficheiro',
				title: 'Erro ao transferir ficheiro',
			});
		}
	};

	//
	// C. Render components

	return (
		<Collapsible
			description="Resumo dos dados do arquivo extraídos do ficheiro feed_info.txt"
			title="Dados do Arquivo"
		>

			<Section gap="sm">
				<FeedInfoDisplay data={validationsDetailContext.data.validation?.gtfs_feed_info} />
			</Section>

			<Section gap="sm">
				{validationsDetailContext.data.file ? (
					<FileItem
						fileName={validationsDetailContext.data.file.name}
						fileType={validationsDetailContext.data.file.type}
						onDownload={handleDownload}
					/>
				) : (
					<Label>Nenhum ficheiro selecionado</Label>
				)}
			</Section>

		</Collapsible>
	);

	//
}
