'use client';

import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { fetchData, uploadFile } from '@/lib/http';
import { Routes } from '@/lib/routes';
import {
	DeleteActionIcon,
	FileButton,
	Label,
	useToast,
} from '@tmlmobilidade/ui';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import styles from './styles.module.css';

export default function AlertImage() {
	//
	// A. Setup Variables
	const { data } = useAlertDetailContext();
	const [imageUrl, setImageUrl] = useState<null | string>(null);
	const [isLoading, setIsLoading] = useState(false);

	//
	// B. Modify Data
	const fetchImageUrl = async () => {
		if (!data.id) {
			throw new Error('Data ID is missing');
		}

		const res = await fetchData<{ data: string, message: string }>(
			Routes.ALERTS_API + Routes.ALERT_IMAGE(data.id),
		);
		setImageUrl(res.data?.data ?? null);
	};

	useEffect(() => {
		fetchImageUrl();
	}, [data.form.getValues().file_id]);

	//
	// C. Handle Actions
	async function handleFileChange(file: File) {
		if (!data.id) {
			throw new Error('Data ID is missing');
		}

		setIsLoading(true);
		// 1. Upload File
		const response = await uploadFile(
			Routes.ALERTS_API + Routes.ALERT_IMAGE(data.id),
			file,
		);

		if (response.error) {
			useToast.error({
				message: response.error,
				title: 'Erro ao carregar imagem',
			});
			return;
		}

		useToast.success({
			message: 'A imagem foi carregada com sucesso',
			title: 'Imagem carregada com sucesso',
		});

		setImageUrl(URL.createObjectURL(file));
		setIsLoading(false);
	}

	async function handleDelete() {
		if (!data.id) {
			throw new Error('Data ID is missing');
		}

		// 1. Upload File
		const response = await fetchData(
			Routes.ALERTS_API + Routes.ALERT_IMAGE(data.id),
			'DELETE',
		);

		if (response.error) {
			useToast.error({
				message: response.error,
				title: 'Erro ao apagar imagem',
			});
			return;
		}

		useToast.success({
			message: 'A imagem foi apagada com sucesso',
			title: 'Imagem apagada com sucesso',
		});

		setImageUrl(null);
		setIsLoading(false);
	}

	//
	// D. Render Components
	return (
		<>
			<Label>Imagem</Label>
			{imageUrl && (
				<div className={styles.container}>
					<Image alt="Imagem da alerta" className={styles.image} height={300} src={imageUrl} width={400} />
					<div className={styles.deleteContainer}>
						<DeleteActionIcon
							confirmMessage="Tem certeza que deseja apagar a imagem?"
							confirmTitle="Apagar imagem"
							onConfirm={handleDelete}
							showConfirmation
						/>
					</div>
				</div>
			)}
			<FileButton
				accept="image/*"
				disabled={!data.id}
				label="Carregar imagem"
				loading={isLoading}
				onFileChange={handleFileChange}
			/>
		</>
	);
}
