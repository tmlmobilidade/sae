/* * */

import { ValidationOptions } from '@/schemas/Validation/options';
import { apexT11 } from '@tmlmobilidade/services/interfaces';
import { createOperationalDate } from '@tmlmobilidade/services/types';

/* * */

export async function GET(request: Request, { params }: { params: Promise<{ agency_id: string, operational_date: string }> }) {
	//

	//
	// Refuse if method is not GET

	if (request.method !== 'GET') {
		throw new Error('Request method not allowed.');
	}

	const reqParams = await params;

	//
	// Setup Agency ID and timestamp boundaries

	if (!reqParams.agency_id || reqParams.agency_id.length !== 2) return Response.json({ message: 'Invalid agency_id param.' }, { status: 400 });
	if (!reqParams.operational_date || reqParams.operational_date.length !== 8) return Response.json({ message: 'Invalid operational_date param.' }, { status: 400 });

	const agencyIds = reqParams.agency_id === 'cm' ? ['41', '42', '43', '44'] : [reqParams.agency_id];

	const operationalDate = createOperationalDate(reqParams.operational_date);

	//
	// Setup the response JSON object

	const responseResult = {
		timestamp: new Date().toISOString(),
		value: -1,
	};

	//
	// Perform database searches

	try {
		responseResult.value = await apexT11.count({
			agency_id: { $in: agencyIds },
			operational_date: operationalDate,
			validation_status: { $in: ValidationOptions.allowed_validation_status },
		});
	}
	catch (err) {
		console.log(err);
		return Response.json({ message: 'Cannot count value.' }, { status: 500 });
	}

	//
	// Send response

	try {
		return Response.json(responseResult);
	}
	catch (err) {
		console.log(err);
		return Response.json({ message: 'Cannot send response.' }, { status: 500 });
	}

	//
}
