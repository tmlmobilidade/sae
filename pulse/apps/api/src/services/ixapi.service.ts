/* * */

import 'dotenv/config';

/* * */

interface IXAPIRequestOptions {

    method?: 'GET' | 'POST';

	body?: Record<string, unknown>;

	/**
	 * The type of the report.
	 *
	 * @ticket - This the type of the report (Ticket Tracking Report)
	 * @ticketWithSubtransaction - Report of ticket tracing with subtransantion
	 * @entityReport - Report of assistance grouped by site
	 * @siteReportByCategory - Report of assistance grouped by site and category
	 * @siteReportByCounter - Report of assistance grouped by site and counter
	 * @siteReportByUser - Report of assistance grouped by site and user
	 * @siteReportByBreakreason - Report of assistance grouped by site, user and break reason
	 * @siteReportByHour - Report of assistance grouped by site, weekday and hour
	 * @siteReportByWeekday - Report of assistance grouped by site and weekday
	 * @siteReportBySubtransaction - Report of assistance grouped by site, category and subtransaction
	 */
	reportType: 'ticket' | 'ticketWithSubtransaction' | 'entityReport' | 'siteReportByCategory' | 'siteReportByCounter' | 'siteReportByUser' | 'siteReportByBreakreason' | 'siteReportByHour' | 'siteReportByWeekday' | 'siteReportBySubtransaction';

	/**
     * A comma-separated list of site EID
	 * @default "-1" to list all
	 * @example "-1" or "1" or "1,2,3"
	 */
	siteEIDs?: string;

    /**
     * The initial date of the report in format "YYYY-MM-DD hh:mm:ss".
     */
    initialDate: string;

    /**
     * The final date of the report in format "YYYY-MM-DD hh:mm:ss".
     * The difference between initial and final date must always be 31 days or less.
     */
    finalDate: string;

    /**
   * A comma-separated list of category IDs.
   * @default "-1" (to list all)
     * Example: "-1" or "1,2,3"
     * Applied exclusively on specific reports.
     */
    categoryEIDs?: string;

     /**
   * A comma-separated list of assistance user IDs.
   * @default "-1" (to list all)
   * Example: "-1" or "1,2,3"
   * Applied exclusively on specific reports.
   */
  assistUserEIDs?: string;

  /**
   * A comma-separated list of counter IDs.
   * @default "-1" (to list all)
   * Example: "-1" or "1,2,3"
   * Applied exclusively on specific reports.
   */
  counterSIDs?: string;

  /**
   * Ticket status:
   * - W: Waiting
   * - O: Ongoing
   * - A: Absent
   * - S: Suspended
   * - F: Finished
   * - E: Error
   * - TS: Transfer to Service Category
   * - TU: Transfer to User
   * - TC: Transfer to Counter
   * Applied exclusively on specific reports.
   */
  status?: string;

  /**
   * A comma-separated list of break reason IDs.
   * @default "-1" (to list all)
   * Example: "-1" or "1,2,3"
   * Applied exclusively on specific reports.
   */
  breakReasonEIDs?: string;

  /**
   * A comma-separated list of groups of site IDs.
   * @default "-1" (to list all)
   * Example: "-1" or "1,2,3"
   * Applied exclusively on specific reports.
   */
  structureEIDs?: string;

  /**
   * The page number to fetch.
   * @default 1
   */
  pageNumber?: number;

}

class IXAPIService {
	//

	private access_token: string;
	private expires_at: Date;

	constructor() {
		this.access_token = '';
		this.expires_at = new Date();
	}

	/* * *
   * REQUEST
   * This function makes GET requests to Carris API and agregates all the steps required for authentication.
   * The process starts by defining flags that serve as logical gates in the authentication flow.
   * On the first iteration of the while loop, perform the desired request and await for the response.
   * If the response code is 401 Unauthorized, then start the authentication flow. If there is some refresh token
   * in memory, then try with that. If not, then try with API key. In all these steps, set the corresponding flag
   * to ensure that on the next iteration of the while loop, the same method is not repeated and the flow gets stuck
   * in an infinite loop. This could be caused due to the way authentication in Carris API is implemented:
   * the system returns invalid tokens for an expired key.
   * This means that the only way to check if the tokens fetched from the current apiKey are valid is to perform the
   * request and look for the response status. Keeping this centralized in one single ‹request()› function
   * allows for a lot of code reuse. Also, if the response is not equal to 200 or 401, throw an error immediately.
   * If all is well, then return the raw data response to the parent caller.
   */

	private async authenticate() {
		try {
			//

			console.log('→ Starting IXAPI authentication...');

			// Initiate a new request to the token endpoint
			const response = await fetch(process.env.IX_AUTH_URL, {
				body: new URLSearchParams({
					client_id: process.env.IX_CLIENT_ID,
					client_secret: process.env.IX_CLIENT_SECRET,
					grant_type: process.env.IX_GRANT_TYPE,
					password: process.env.IX_PASSWORD,
					server: process.env.IX_SERVER_KEY,
					username: process.env.IX_USERNAME,
				}),
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				method: 'POST',
			});

			// Parse response
			const responseData = await response.json();

			// Save authorization values
			this.access_token = responseData.access_token;

			// Save expire times
			const now = new Date();
			this.expires_at = new Date(now.getTime() + responseData.expires_in * 1000);

			console.log('→ IXAPI Authentication successful');

			//
		}
		catch (err) {
			console.log('→ IXAPI Authentication failed', err);
		}
	}

	/* MARK: - SECTION 8: FETCH AUTH TOKEN FROM CARRIS API */
	/* This is the function where a valid ‹authToken› is requested to Carris Authentication endpoint. */
	/* Depending on the method of authentication ['apikey', 'refresh'], just perform the request and */
	/* save the result to the respective variables. */

	public async request(options: IXAPIRequestOptions) {
		//

		// Renew token if no longer valid
		const isTokenExpired = this.expires_at < new Date();
		if (isTokenExpired) await this.authenticate();

		const response = await fetch(`${process.env.IX_BASE_URL}/statistics`, {
			body: options.body ? JSON.stringify(options.body) : undefined,
			headers: {
				'Authorization': `Bearer ${this.access_token}`,
				'Content-Type': 'application/json',
				'StatisticsFilter': JSON.stringify({
					header: { method: 'statisticsGetReport' },
					content: {
						apiVersion: '1.0',
						rowsPerPage: 2000,
						...options,
					},
				}),
			},
			method: options.method || 'GET',
		});

		return await response.json();

		//
	}

	//
}

/* * */

export const IXAPI = new IXAPIService();
