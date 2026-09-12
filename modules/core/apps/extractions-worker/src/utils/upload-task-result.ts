/* * */

import { storageProvider } from '@tmlmobilidade/go-providers-storage';
import { type Attachment } from '@tmlmobilidade/go-types-core';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';
import fs from 'node:fs';

/* * */

interface UploadTaskResultParams {
	attachment_name: string
	created_by: null | string | undefined
	extraction_id: string
	updated_by: null | string | undefined
	zip_file_path: string
}

/**
 * Upload the task result to the storage provider.
 * @param params The parameters for the upload.
 */
export async function uploadTaskResult(params: UploadTaskResultParams): Promise<Attachment> {
	//

	const timer = new Timer();

	const buffer = fs.readFileSync(params.zip_file_path);

	const uploadResult = await storageProvider.upload(buffer, {
		created_by: params.created_by || 'system',
		name: params.attachment_name,
		resource_id: params.extraction_id,
		scope: 'extractions',
		size: buffer.byteLength,
		type: 'application/zip',
		updated_by: params.updated_by || 'system',
	});

	Logger.success(`Uploaded new extraction "${params.extraction_id}" zip file to storage provider in ${timer.get()}.`);

	return uploadResult;
}
