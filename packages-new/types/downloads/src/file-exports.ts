/* * */

import { GtfsExportSchema } from '@/gtfs-export.js';
import { PlanExportSchema } from '@/plan-export.js';
import { PlanPostersExportSchema } from '@/plan-posters-export.js';
import { RideExportSchema } from '@/ride-export.js';
import { SamsAnalysisExportSchema } from '@/sams-analysis-export.js';
import { StopExportSchema } from '@/stop-export.js';
import { VehicleExportSchema } from '@/vehicle-export.js';
import { z } from 'zod';

/* * */

export const FileExportSchema = z.discriminatedUnion('type', [
	GtfsExportSchema,
	PlanExportSchema,
	PlanPostersExportSchema,
	RideExportSchema,
	SamsAnalysisExportSchema,
	StopExportSchema,
	VehicleExportSchema,
]);

export type FileExport = z.infer<typeof FileExportSchema>;
