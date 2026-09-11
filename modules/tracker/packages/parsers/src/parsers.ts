/* * */

import { type RawVehicleEvent, type SimplifiedVehicleEvent } from '@tmlmobilidade/go-types-vehicle-events';

import { parseRawVehicleEventEsCrtmAisaV1 } from './es/crtm/aisa/v1.js';
import { parseRawVehicleEventEsCrtmLaVelozV1 } from './es/crtm/la-veloz/v1.js';
import { parseRawVehicleEventPtTmlCcflV1 } from './pt/tml/ccfl/v1.js';
import { parseRawVehicleEventPtTmlCmAlsaV1 } from './pt/tml/cm/alsa/v1.js';
import { parseRawVehicleEventPtTmlCmRlV1 } from './pt/tml/cm/rl/v1.js';
import { parseRawVehicleEventPtTmlCmTstV1 } from './pt/tml/cm/tst/v1.js';
import { parseRawVehicleEventPtTmlCmVaV1 } from './pt/tml/cm/va/v1.js';
import { parseRawVehicleEventPtTmlCpV1 } from './pt/tml/cp/v1.js';
import { parseRawVehicleEventPtTmlFertagusV1 } from './pt/tml/fertagus/v1.js';
import { parseRawVehicleEventPtTmlMlV1 } from './pt/tml/ml/v1.js';
import { parseRawVehicleEventPtTmlMobiV1 } from './pt/tml/mobi/v1.js';
import { parseRawVehicleEventPtTmlTcbV1 } from './pt/tml/tcb/v1.js';
import { parseRawVehicleEventPtTmlTtslV1 } from './pt/tml/ttsl/v1.js';
import { parseRawVehicleEventPtTmpUnirUt1V1 } from './pt/tmp/unir/ut1/v1.js';
import { parseRawVehicleEventPtTmpUnirUt2V1 } from './pt/tmp/unir/ut2/v1.js';
import { parseRawVehicleEventPtTmpUnirUt3V1 } from './pt/tmp/unir/ut3/v1.js';
import { parseRawVehicleEventPtTmpUnirUt4V1 } from './pt/tmp/unir/ut4/v1.js';
import { parseRawVehicleEventPtTmpUnirUt5V1 } from './pt/tmp/unir/ut5/v1.js';
import { parseRawVehicleEventPtTmpUnirUt6V1 } from './pt/tmp/unir/ut6/v1.js';

/* * */

export const PARSER_MAP: Record<RawVehicleEvent['version'], (vehicleEvent: RawVehicleEvent) => Promise<null | SimplifiedVehicleEvent>> = {
	'es-crtm-aisa-v1': parseRawVehicleEventEsCrtmAisaV1,
	'es-crtm-la-veloz-v1': parseRawVehicleEventEsCrtmLaVelozV1,
	'pt-tml-ccfl-v1': parseRawVehicleEventPtTmlCcflV1,
	'pt-tml-cm-alsa-v1': parseRawVehicleEventPtTmlCmAlsaV1,
	'pt-tml-cm-rl-v1': parseRawVehicleEventPtTmlCmRlV1,
	'pt-tml-cm-tst-v1': parseRawVehicleEventPtTmlCmTstV1,
	'pt-tml-cm-va-v1': parseRawVehicleEventPtTmlCmVaV1,
	'pt-tml-cp-v1': parseRawVehicleEventPtTmlCpV1,
	'pt-tml-fertagus-v1': parseRawVehicleEventPtTmlFertagusV1,
	'pt-tml-ml-v1': parseRawVehicleEventPtTmlMlV1,
	'pt-tml-mobi-v1': parseRawVehicleEventPtTmlMobiV1,
	'pt-tml-tcb-v1': parseRawVehicleEventPtTmlTcbV1,
	'pt-tml-ttsl-v1': parseRawVehicleEventPtTmlTtslV1,
	'pt-tmp-unir-ut1-v1': parseRawVehicleEventPtTmpUnirUt1V1,
	'pt-tmp-unir-ut2-v1': parseRawVehicleEventPtTmpUnirUt2V1,
	'pt-tmp-unir-ut3-v1': parseRawVehicleEventPtTmpUnirUt3V1,
	'pt-tmp-unir-ut4-v1': parseRawVehicleEventPtTmpUnirUt4V1,
	'pt-tmp-unir-ut5-v1': parseRawVehicleEventPtTmpUnirUt5V1,
	'pt-tmp-unir-ut6-v1': parseRawVehicleEventPtTmpUnirUt6V1,
};
