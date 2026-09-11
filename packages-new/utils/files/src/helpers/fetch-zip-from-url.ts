/* * */

/**
 * Fetches a ZIP file from a URL and returns it as an ArrayBuffer.
 * @param url The URL of the ZIP file to fetch.
 * @returns A Promise that resolves to an ArrayBuffer containing the ZIP file data.
 * @throws If the HTTP request fails or returns a non-200 status code.
 * @deprecated Just make the HTTP request directly.
 */
export async function fetchZipFromUrl(url: string): Promise<ArrayBuffer> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to fetch ZIP file: HTTP ${response.status} - ${response.statusText}`);
	return await response.arrayBuffer();
}
