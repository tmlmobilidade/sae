"use client";

import { fetchData, uploadFile } from "@/lib/http";
import { Routes } from "@/lib/routes";
import { FileButton, Label, useToast } from "@tmlmobilidade/ui";
import { useAlertDetailContext } from "@/contexts/AlertDetail.context";
import { useEffect, useState } from "react";

import styles from "./styles.module.css";

export default function AlertImage() {
	//
	// A. Setup Variables
	const { data } = useAlertDetailContext();
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	//
	// B. Modify Data
	const fetchImageUrl = async () => {
		const res = await fetchData<{data: string, message: string}>(Routes.ALERTS_API + Routes.ALERT_IMAGE(data.id!));
		setImageUrl(res.data?.data ?? null);
	};
	
	useEffect(() => {
		fetchImageUrl();
	}, [data.form.getValues().file_id]);
	

	
	//
	// C. Handle Actions
	async function handleFileChange(file: File) {
		//1. Upload File
		const response = await uploadFile(Routes.ALERTS_API + Routes.ALERT_IMAGE(data.id!), file);
		
		if (response.error) {
			useToast.error({
				title: "Erro ao carregar imagem",
				message: response.error,
			});
			return;
		}
		
		useToast.success({
			title: "Imagem carregada com sucesso",
			message: "A imagem foi carregada com sucesso",
		});
	}


	//
	// D. Render Components
	return (
		<>
			<Label>Imagem</Label>
			{imageUrl && (
				<div className={styles.container}>
					<img src={imageUrl} alt="Imagem da alerta"/>
				</div> 
			)}
			<FileButton accept="image/*" label={"Carregar imagem"} onFileChange={handleFileChange}/>
		</>
	);
}