'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type Attachment } from '@tmlmobilidade/go-types-core';
import { type GtfsValidation } from '@tmlmobilidade/go-types-operation';
import { type ApiResponse, type ProcessingStatus } from '@tmlmobilidade/go-types-shared';
import { fetchApiData, useToast } from '@tmlmobilidade/ui';
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from 'react';
import useSWR from 'swr';

import { useValidationsListData } from '../list/use-validations-list-data';
import { useGtfsValidationsDetailData } from './use-gtfs-validations-detail-data';
import { useValidationsDetailValidationId } from './use-validations-detail-validation-id';

/* * */

interface ValidationsDetailContextState {
	actions: {
		updateProcessingStatus: (status: ProcessingStatus) => Promise<void>
	}
	data: {
		file: Attachment | null
		validation: GtfsValidation | null
	}
	flags: {
		can_approve: boolean
		error: Error | null
		loading: boolean
	}
}

/* * */

const ValidationsDetailContext = createContext<undefined | ValidationsDetailContextState>(undefined);

export function useValidationsDetailContext() {
	const context = useContext(ValidationsDetailContext);
	if (!context) {
		throw new Error('useValidationsDetailContext must be used within a ValidationsDetailContextProvider');
	}
	return context;
}

/* * */

export const ValidationsDetailContextProvider = ({ children }: PropsWithChildren) => {
	//

	//
	// A. Setup variables

	const { validationId } = useValidationsDetailValidationId();

	const { data: validationData, error: validationError, isLoading: validationLoading, mutate: validationMutate } = useGtfsValidationsDetailData();

	//
	// B. Fetch data

	const { mutate: validationsListMutate } = useValidationsListData();

	const { data: fileResponse, error: fileSwrError, isLoading: fileLoading } = useSWR<ApiResponse<Attachment>>(API_ROUTES.operation.GTFS_VALIDATIONS_DETAIL_FILE(validationId), {
		fetcher: async (url: string) => await fetchApiData<Attachment>({ url }),
	});

	const fileData = fileResponse?.data ?? null;

	const fileError = fileResponse?.error ?? (fileSwrError instanceof Error ? fileSwrError.message : null);

	//
	// C. Handle actions

	const updateProcessingStatus = useCallback(async (status: ProcessingStatus) => {
		if (!validationId) {
			useToast.error({ message: 'ID da validação é obrigatório.', title: 'Erro' });
			return;
		}
		try {
			const response = await fetchApiData<GtfsValidation>({
				body: { processing_status: status },
				method: 'PUT',
				url: API_ROUTES.operation.GTFS_VALIDATIONS_DETAIL_PROCESSING_STATUS(validationId),
			});
			if (response.error || !response.data) {
				useToast.error({ message: response.error ?? 'Erro ao atualizar estado da validação.', title: 'Erro' });
				return;
			}
			validationMutate();
			validationsListMutate();
		} catch (error) {
			useToast.error({ message: error instanceof Error ? error.message : 'Erro ao atualizar estado da validação.', title: 'Erro' });
		}
	}, [validationId, validationMutate, validationsListMutate]);

	//
	// D. Define context value

	const contextValue: ValidationsDetailContextState = useMemo(() => ({
		actions: {
			updateProcessingStatus,
		},
		data: {
			file: fileData,
			validation: validationData,
		},
		flags: {
			can_approve: validationData?.processing_status === 'complete' && validationData?.validity_status === 'valid',
			error: validationError || fileError ? new Error(validationError || fileError || 'Failed to load validation') : null,
			loading: validationLoading || fileLoading,
		},
	}), [
		fileData,
		fileError,
		fileLoading,
		updateProcessingStatus,
		validationData,
		validationError,
		validationLoading,
	]);

	//
	// E. Render components

	return (
		<ValidationsDetailContext.Provider value={contextValue}>
			{children}
		</ValidationsDetailContext.Provider>
	);

	//
};
