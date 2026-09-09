import { AGENCY_IDS, getAgencyDisplayInfo, getAgencyInfo, getAgencyLogo, getAgencyMapOperatorId } from '@/lib/agency-catalog';
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

/* * */

describe('agency catalog', () => {
	it('keeps every supported agency presentation in one catalog', () => {
		assert.equal(AGENCY_IDS.length, 12);

		for (const agencyId of AGENCY_IDS) {
			const agency = getAgencyInfo(agencyId);
			assert.ok(agency?.fullName);
			assert.ok(agency?.shortName);
			assert.ok(agency?.vehicleMapIcon);
			assert.ok(getAgencyLogo(agencyId, '120x120', 'light'));
		}
	});

	it('exposes Carris Metropolitana as a display group without treating it as an agency', () => {
		assert.equal(getAgencyInfo('CM'), undefined);
		assert.equal(getAgencyDisplayInfo('CM')?.fullName, 'Carris Metropolitana');
		assert.match(getAgencyLogo('CM', '180x120', 'light') ?? '', /agency-logo-cmet-180x120-light\.png$/);
	});

	it('derives map operator membership from agency metadata', () => {
		for (const agencyId of ['A2L1N', 'BNA17', 'LA77N', 'YA15B']) {
			assert.equal(getAgencyMapOperatorId(agencyId), 'CM');
		}

		assert.equal(getAgencyMapOperatorId('IA2N9'), 'IA2N9');
		assert.equal(getAgencyMapOperatorId('unknown-agency'), null);
	});

	it('does not invent presentation data for unknown agencies', () => {
		assert.equal(getAgencyDisplayInfo('unknown-agency'), undefined);
		assert.equal(getAgencyLogo('unknown-agency', '120x120', 'light'), undefined);
	});
});
