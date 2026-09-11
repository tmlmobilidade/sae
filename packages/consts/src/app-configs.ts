/* * */

import { type Environment, getCurrentEnvironment } from '@tmlmobilidade/go-types-shared';

/* * */

type FrontendNamedUrlKey = `frontend_${string}_url`;

type ModuleConfigGroup = Partial<Record<FrontendNamedUrlKey, null | string>> & {
	api_port: number
	api_url: string
	cors_origin: RegExp | string | true
	frontend_port: null | number
	frontend_url?: null | string
};

/* * */

const DEFAULT_PRD_CONFIG: Omit<ModuleConfigGroup, 'api_url' | 'frontend_url'> = {
	api_port: 5050,
	cors_origin: new RegExp(`https://go.tmlmobilidade.pt$`),
	frontend_port: 3000,
};

const DEFAULT_STG_CONFIG: Omit<ModuleConfigGroup, 'api_url' | 'frontend_url'> = {
	api_port: 5050,
	cors_origin: new RegExp(`https://*.go-stg.tmlmobilidade.pt$`),
	frontend_port: 3000,
};

const MODULE_CONFIGS: Record<string, Record<Environment, ModuleConfigGroup>> = {

	core: {
		dev: {
			api_port: 52000,
			api_url: 'http://localhost:52000',
			cors_origin: true,
			frontend_port: 51000,
			frontend_url: 'http://localhost:51000/core',
		},
		prd: {
			api_url: 'https://go.tmlmobilidade.pt/core/api',
			frontend_url: 'https://go.tmlmobilidade.pt/core',
			...DEFAULT_PRD_CONFIG,
		},
		stg: {
			api_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/core/api`,
			frontend_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/core`,
			...DEFAULT_STG_CONFIG,
		},
	},

	dates: {
		dev: {
			api_port: 52008,
			api_url: 'http://localhost:52008',
			cors_origin: true,
			frontend_port: 51008,
			frontend_url: 'http://localhost:51008/dates',
		},
		prd: {
			api_url: 'https://go.tmlmobilidade.pt/dates/api',
			frontend_url: 'https://go.tmlmobilidade.pt/dates',
			...DEFAULT_PRD_CONFIG,
			cors_origin: true,
		},
		stg: {
			api_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/dates/api`,
			frontend_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/dates`,
			...DEFAULT_STG_CONFIG,
			cors_origin: true,
		},
	},

	exporter: {
		dev: {
			api_port: 52007,
			api_url: 'http://localhost:52007',
			cors_origin: true,
			frontend_port: 51007,
			frontend_url: 'http://localhost:51007/exporter',
		},
		prd: {
			api_url: 'https://go.tmlmobilidade.pt/exporter/api',
			frontend_url: 'https://go.tmlmobilidade.pt/exporter',
			...DEFAULT_PRD_CONFIG,
		},
		stg: {
			api_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/exporter/api`,
			frontend_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/exporter`,
			...DEFAULT_STG_CONFIG,
		},
	},

	hub: {
		dev: {
			api_port: 52100,
			api_url: 'http://localhost:52100',
			cors_origin: true,
			frontend_navegante_app_url: 'http://localhost:51101/hub',
			frontend_port: 51100,
			frontend_videowall_app_url: 'http://localhost:51102/hub',
		},
		prd: {
			api_url: 'https://go.tmlmobilidade.pt/hub/api',
			frontend_url: 'https://go.tmlmobilidade.pt/hub',
			...DEFAULT_PRD_CONFIG,
		},
		stg: {
			api_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/hub/api`,
			frontend_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/hub`,
			...DEFAULT_STG_CONFIG,
		},
	},

	infrastructure: {
		dev: {
			api_port: 52003,
			api_url: 'http://localhost:52003',
			cors_origin: true,
			frontend_port: 51003,
			frontend_url: 'http://localhost:51003/infrastructure',
		},
		prd: {
			api_url: 'https://go.tmlmobilidade.pt/infrastructure/api',
			frontend_url: 'https://go.tmlmobilidade.pt/infrastructure',
			...DEFAULT_PRD_CONFIG,
		},
		stg: {
			api_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/infrastructure/api`,
			frontend_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/infrastructure`,
			...DEFAULT_STG_CONFIG,
		},
	},

	offer: {
		dev: {
			api_port: 52010,
			api_url: 'http://localhost:52010',
			cors_origin: true,
			frontend_port: 51010,
			frontend_url: 'http://localhost:51010/offer',
		},
		prd: {
			api_url: 'https://go.tmlmobilidade.pt/offer/api',
			frontend_url: 'https://go.tmlmobilidade.pt/offer',
			...DEFAULT_PRD_CONFIG,
		},
		stg: {
			api_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/offer/api`,
			frontend_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/offer`,
			...DEFAULT_STG_CONFIG,
		},
	},

	operation: {
		dev: {
			api_port: 52004,
			api_url: 'http://localhost:52004',
			cors_origin: true,
			frontend_port: 51004,
			frontend_url: 'http://localhost:51004/operation',
		},
		prd: {
			api_url: 'https://go.tmlmobilidade.pt/operation/api',
			frontend_url: 'https://go.tmlmobilidade.pt/operation',
			...DEFAULT_PRD_CONFIG,
		},
		stg: {
			api_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/operation/api`,
			frontend_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/operation`,
			...DEFAULT_STG_CONFIG,
		},
	},

	performance: {
		dev: {
			api_port: 52006,
			api_url: 'http://localhost:52006',
			cors_origin: true,
			frontend_port: 51006,
			frontend_url: 'http://localhost:51006/performance',
		},
		prd: {
			api_url: 'https://go.tmlmobilidade.pt/performance/api',
			frontend_url: 'https://go.tmlmobilidade.pt/performance',
			...DEFAULT_PRD_CONFIG,
		},
		stg: {
			api_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/performance/api`,
			frontend_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt/performance`,
			...DEFAULT_STG_CONFIG,
		},
	},

	root: {
		dev: {
			api_port: 50000,
			api_url: 'http://localhost:50000',
			cors_origin: true,
			frontend_port: 51000,
			frontend_url: 'http://localhost:51000',
		},
		prd: {
			api_url: 'https://go.tmlmobilidade.pt',
			frontend_url: 'https://go.tmlmobilidade.pt',
			...DEFAULT_PRD_CONFIG,
		},
		stg: {
			api_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt`,
			frontend_url: `https://${process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT}.go-stg.tmlmobilidade.pt`,
			...DEFAULT_STG_CONFIG,
		},
	},
} as const satisfies Record<string, Record<Environment, ModuleConfigGroup>>;

/**
 * Retrieves the value of a specific property from the module configuration for a given module and environment.
 * @param module The module ID.
 * @param property The property of the module configuration to retrieve (e.g., 'api_url', 'frontend_url', 'frontend_navegante_app_url').
 * @param environment The environment to get the property for. If not provided, it will use the ENVIRONMENT environment variable.
 * @returns The value of the specified property for the given module and environment.
 */
export function getModuleConfig<Prop extends keyof ModuleConfigGroup>(module: keyof typeof MODULE_CONFIGS, property: Prop, environment?: Environment): ModuleConfigGroup[Prop] {
	// Get the desired module object
	const moduleObject = MODULE_CONFIGS[module];
	if (!moduleObject) throw new Error(`[@core/lib] Module Config Object for "${module}" module not found. Available modules: ${Object.keys(MODULE_CONFIGS).join(', ')}`);
	// Extract the current module environment either from the parameter
	// or automatically from the set environment variable.
	const currentEnvironment = environment || getCurrentEnvironment();
	// Get the config group for the current environment
	const configGroupForEnvironment = moduleObject[currentEnvironment] || moduleObject['stg'];
	// Get the property value from the config group
	const propertyValue = configGroupForEnvironment[property];
	if (propertyValue === undefined) throw new Error(`[@core/lib] Property "${property}" for module "${module}" in environment "${currentEnvironment}" not found. Available properties: ${Object.keys(configGroupForEnvironment).join(', ')}`);
	// Return the value
	return propertyValue;
}
