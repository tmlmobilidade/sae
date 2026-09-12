'use client';

import namespaceAlertsEs from './namespaces/alerts/es.json' with { type: 'json' };
import namespaceAlertsPt from './namespaces/alerts/pt.json' with { type: 'json' };
import namespaceComponentsEs from './namespaces/components/es.json' with { type: 'json' };
import namespaceComponentsPt from './namespaces/components/pt.json' with { type: 'json' };
import namespaceDatatableEs from './namespaces/datatable/es.json' with { type: 'json' };
import namespaceDatatablePt from './namespaces/datatable/pt.json' with { type: 'json' };
import namespaceExtractionsEs from './namespaces/extractions/es.json' with { type: 'json' };
import namespaceExtractionsPt from './namespaces/extractions/pt.json' with { type: 'json' };
import namespaceFiltersEs from './namespaces/filters/es.json' with { type: 'json' };
import namespaceFiltersPt from './namespaces/filters/pt.json' with { type: 'json' };
import namespaceOperationsEs from './namespaces/operations/es.json' with { type: 'json' };
import namespaceOperationsPt from './namespaces/operations/pt.json' with { type: 'json' };
import namespaceStatusEs from './namespaces/status/es.json' with { type: 'json' };
import namespaceStatusPt from './namespaces/status/pt.json' with { type: 'json' };

/**
 * Resource keys for i18n translations in Portuguese.
 * These keys map to the respective translation files
 * for each language and namespace. They are the glue that
 * connects the i18n system to the actual translation strings.
 */
export const i18nResourceKeysPtShared = {
	shared: {
		alerts: namespaceAlertsPt,
		components: namespaceComponentsPt,
		datatable: namespaceDatatablePt,
		extractions: namespaceExtractionsPt,
		filters: namespaceFiltersPt,
		operations: namespaceOperationsPt,
		status: namespaceStatusPt,
	},
} as const;

/**
 * Resource keys for i18n translations in Spanish.
 */
export const i18nResourceKeysEsShared = {
	shared: {
		alerts: namespaceAlertsEs,
		components: namespaceComponentsEs,
		datatable: namespaceDatatableEs,
		extractions: namespaceExtractionsEs,
		filters: namespaceFiltersEs,
		operations: namespaceOperationsEs,
		status: namespaceStatusEs,
	},
} as const;
