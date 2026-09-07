/* * */

import { type OperationalDate } from '@tmlmobilidade/go-types-shared';

/**
 * Get weekday names in Portuguese from weekday indexes.
 * @param weekdayIndexes Array of weekday indexes (1=Monday, 7=Sunday)
 * @returns Array of weekday names in Portuguese.
 */
export function getWeekdayNames(weekdayIndexes: string[]): string[] {
	return weekdayIndexes.sort().map((d) => {
		switch (d) {
			case '1': return 'Segundas';
			case '2': return 'Terças';
			case '3': return 'Quartas';
			case '4': return 'Quintas';
			case '5': return 'Sextas';
			case '6': return 'Sábados';
			case '7': return 'Domingos';
			default: return '';
		}
	}).filter(Boolean);
}

/**
 * Get period names in Portuguese from period indexes.
 * @param periodIndexes Array of period indexes (1=School Period, 2=School Holidays, 3=Summer Period)
 * @returns Array of period names in Portuguese.
 */
export function getPeriodName(period: string): string {
	switch (period) {
		case '1': return 'Período Escolar';
		case '2': return 'Férias Escolares';
		case '3': return 'Período de Verão';
		default: return '';
	}
}

/**
 * Get formatted dates in Portuguese from an array of OperationalDate (YYYYMMDD).
 *
 * Rules:
 * - Only consecutive (>=3 days) on same month: "4 a 7 Fev. 2025"
 * - Only 2 consecutive days: "4 e 5 Fev. 2025"
 * - Consecutive + non-consecutive, or mixed with 2-day range: treat all as non-consecutive → "1, 7, 8 e 14 Dez. 2025"
 * - Only non-consecutive: "12, 14 e 22 Fev. 2025"
 */
export function getFormattedDates(dates: OperationalDate[]): string {
	// Sort and deduplicate
	const sortedDates = Array.from(new Set(dates)).sort();

	// Group by month and year
	const groupedDates: Record<string, number[]> = {};
	for (const date of sortedDates) {
		const monthYear = date.slice(0, 6); // YYYYMM
		const day = parseInt(date.slice(6, 8), 10);
		if (!groupedDates[monthYear]) groupedDates[monthYear] = [];
		groupedDates[monthYear].push(day);
	}

	// Month names in Portuguese
	const monthNames = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];

	const formattedGroups = Object.entries(groupedDates).map(([monthYear, days]) => {
		const year = monthYear.slice(0, 4);
		const month = parseInt(monthYear.slice(4, 6), 10);

		days.sort((a, b) => a - b);

		// Identify consecutive ranges
		const ranges: number[][] = [];
		let start = days[0];
		let prev = days[0];

		for (let i = 1; i < days.length; i++) {
			if (days[i] === prev + 1) {
				prev = days[i];
			} else {
				ranges.push([start, prev]);
				start = days[i];
				prev = days[i];
			}
		}
		ranges.push([start, prev]);

		const hasNonConsecutive = ranges.some(([a, b]) => a === b);
		const hasTwoDayRange = ranges.some(([a, b]) => b === a + 1);
		const hasLongRange = ranges.some(([a, b]) => b > a + 1);

		let formatted: string;

		// Helper to format a range properly
		const formatRange = ([a, b]: [number, number]) => (b === a + 1 ? `${a} e ${b}` : `de ${a} a ${b}`);

		// Case 1: Only consecutive (>=3)
		if (hasLongRange && !hasNonConsecutive && !hasTwoDayRange) {
			const [a, b] = ranges.find(([a, b]) => b > a + 1);
			formatted = `${formatRange([a, b])} ${monthNames[month - 1]} ${year}`;
		} else if (hasTwoDayRange && !hasNonConsecutive && !hasLongRange && ranges.length === 1) {
			// Case 2: Only one 2-day range
			const [a, b] = ranges[0];
			formatted = `${formatRange([a, b])} ${monthNames[month - 1]} ${year}`;
		} else if (hasLongRange && hasNonConsecutive) {
			// Case 3: Mix of long ranges + non-consecutive
			const rangeParts = ranges
				.filter(([a, b]) => b > a + 1)
				.map(formatRange)
				.join(', ');
			const nonConsecDays = ranges
				.filter(([a, b]) => a === b)
				.map(([a]) => a)
				.sort((a, b) => a - b);

			const nonConsecList
				= nonConsecDays.length > 1
					? `${nonConsecDays.slice(0, -1).join(', ')} e ${nonConsecDays.at(-1)}`
					: `${nonConsecDays[0]}`;

			formatted = `${rangeParts} ${monthNames[month - 1]} e ${nonConsecList} ${monthNames[month - 1]} ${year}`;
		} else {
			// Case 4: Only non-consecutive or mix with 2-day pairs → treat all as non-consecutive
			const allDays = ranges.flatMap(([a, b]) => {
				if (b === a) return [a];
				if (b === a + 1) return [a, b]; // expand 2-day range
				const expanded: number[] = [];
				for (let d = a; d <= b; d++) expanded.push(d);
				return expanded;
			});

			allDays.sort((a, b) => a - b);

			const list
				= allDays.length > 1
					? `${allDays.slice(0, -1).join(', ')} e ${allDays.at(-1)}`
					: `${allDays[0]}`;
			formatted = `${list} ${monthNames[month - 1]} ${year}`;
		}

		return formatted;
	});

	return formattedGroups.join('; ');
}
