'use client';

/* * */

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type Stop, type StopId } from '@tmlmobilidade/go-types-infrastructure';
import { type PatternStopSearchItem } from '@tmlmobilidade/go-types-offer';
import { fetchApiData, Select, useToast } from '@tmlmobilidade/ui';
import { useEffect, useMemo, useState } from 'react';

import { createStopOptions } from './stop-options';

/* * */

interface ShapeEditorStopSelectProps {
	disabled?: boolean
	excludeStopIds?: StopId[]
	label?: string
	onChange: (stop: null | Stop) => void
	value: null | Stop
}

/* * */

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

export function ShapeEditorStopSelect({ disabled, excludeStopIds = [], label, onChange, value }: ShapeEditorStopSelectProps) {
	//

	//
	// A. Setup variables

	const [isLoading, setIsLoading] = useState(false);
	const [results, setResults] = useState<PatternStopSearchItem[]>([]);
	const [searchValue, setSearchValue] = useState('');

	//
	// B. Fetch data

	useEffect(() => {
		const query = searchValue.trim();
		if (query.length < MIN_SEARCH_LENGTH) {
			setResults([]);
			setIsLoading(false);
			return;
		}

		const abortController = new AbortController();
		const timeout = window.setTimeout(() => {
			setIsLoading(true);

			const url = new URL(API_ROUTES.offer.PATTERNS_STOPS);
			url.searchParams.set('query', query);

			void fetchApiData<PatternStopSearchItem[]>({ options: { signal: abortController.signal }, url: url.toString() }).then((response) => {
				if (abortController.signal.aborted) return;
				setResults(response.data ?? []);
			}).finally(() => {
				if (!abortController.signal.aborted) setIsLoading(false);
			});
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			abortController.abort();
			window.clearTimeout(timeout);
		};
	}, [searchValue]);

	//
	// C. Transform data

	const options = useMemo(() => createStopOptions({ excludeStopIds, results, value }), [excludeStopIds, results, value]);

	//
	// D. Handle actions

	const handleChange = async (stopId: null | string) => {
		if (!stopId) {
			onChange(null);
			return;
		}

		setIsLoading(true);
		const response = await fetchApiData<Stop>({ url: API_ROUTES.offer.PATTERNS_STOPS_DETAIL(stopId) });
		setIsLoading(false);

		if (response.error || !response.data) {
			useToast.error({ message: response.error ?? 'Erro ao carregar paragem', title: 'Erro ao carregar paragem' });
			return;
		}

		onChange(response.data);
	};

	//
	// E. Render component

	return (
		<Select
			data={options}
			disabled={disabled}
			label={label}
			loading={isLoading}
			nothingFoundMessage={searchValue.trim().length < MIN_SEARCH_LENGTH ? 'Escreva pelo menos 2 caracteres' : 'Nenhuma paragem encontrada'}
			onChange={stopId => void handleChange(stopId)}
			onSearchChange={setSearchValue}
			placeholder="Pesquisar paragem..."
			searchValue={searchValue}
			value={value ? String(value._id) : null}
			w="100%"
		/>
	);

	//
}
