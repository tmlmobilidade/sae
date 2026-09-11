/* eslint-disable @typescript-eslint/naming-convention */

import { CALENDAR_DATE_FORMAT, type CalendarDate, DateFormat, OPERATIONAL_DATE_FORMAT, type OperationalDateInt, OperationalDateIntSchema, type TimezoneIdentified, type UnixMilliseconds, type UnixSeconds } from '@tmlmobilidade/go-types-shared';
import { type DateObjectUnits, DateTime, type DateTimeUnit, type DurationObjectUnits } from 'luxon';

import { DateFormatConfigMap } from './date-format.js';

/* * */

interface DatesConstructor {
	calendar_date: CalendarDate
	iso: null | string
	js_date: Date
	operational_date_int: OperationalDateInt
	std_window: { end: UnixMilliseconds, start: UnixMilliseconds }
	unix_milliseconds: UnixMilliseconds
	unix_seconds: UnixSeconds
}

/* * */

export class Dates {
	//

	static readonly standardWindowHours = 10;
	static readonly standardWindowMilliseconds = this.standardWindowHours * 1000 * 60 * 60;

	public calendar_date: CalendarDate;
	public iso: null | string;
	public js_date: Date;
	public operational_date_int: OperationalDateInt;
	public std_window: { end: UnixMilliseconds, start: UnixMilliseconds };
	public unix_milliseconds: UnixMilliseconds;
	public unix_seconds: UnixSeconds;

	constructor(params: DatesConstructor) {
		this.calendar_date = params.calendar_date;
		this.iso = params.iso ?? null;
		this.js_date = params.js_date;
		this.operational_date_int = params.operational_date_int;
		this.std_window = params.std_window;
		this.unix_milliseconds = params.unix_milliseconds;
		this.unix_seconds = params.unix_seconds;
	}

	/**
	 * Creates a Dates object from a date/time string in a specific format.
	 * @param text The date/time string to parse.
	 * @param format The format string to use for parsing the date/time.
	 *   See Luxon documentation for format tokens: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
	 * @param timezone The timezone to set for the Dates object.
	 * @returns A new Dates object parsed from the string.
	 */
	static fromFormat(text: string, format: string, timezone: 'local' | 'utc' | TimezoneIdentified): Dates {
		const dateTime = DateTime
			.fromFormat(text, format, { setZone: true })
			.setZone(timezone, { keepLocalTime: true });
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.prototype.getOperationalDateInt(dateTime.toISO()),
			std_window: this.prototype.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Creates a Dates object from an ISO 8601 date/time string.
	 * This method assumes the string has a timezone offset.
	 * @param isoText The ISO 8601 date/time string to parse.
	 * @returns A new Dates object created from the ISO string.
	 */
	static fromISO(isoText: string): Dates {
		const dateTime = DateTime.fromISO(isoText, { setZone: true });
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.prototype.getOperationalDateInt(dateTime.toISO()),
			std_window: this.prototype.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Creates a Dates object from a JavaScript Date object.
	 * @param date The JavaScript Date object to convert. It is assumed that the date is in UTC.
	 * @returns A new Dates object created from the JavaScript Date.
	 */
	static fromJSDate(date: Date): Dates {
		const dateTime = DateTime
			.fromJSDate(date)
			.setZone('utc', { keepLocalTime: false });
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.prototype.getOperationalDateInt(dateTime.toISO()),
			std_window: this.prototype.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Creates a Dates object from an operational date integer.
	 * @param date The operational date integer in 'yyyyMMdd' format.
	 * @param timezone The timezone to set for the Dates object.
	 * @returns A new Dates object created from the operational date.
	 */
	static fromOperationalDateInt(date: OperationalDateInt | string, timezone: 'local' | 'utc' | TimezoneIdentified): Dates {
		// Validate the date
		const validatedDate = OperationalDateIntSchema.safeParse(date);
		if (!validatedDate.success) throw new Error(`Received an invalid operational date: ${date} - ${validatedDate.error.message}`);
		// Create the date time object
		const dateTime = DateTime
			.fromFormat(String(validatedDate.data), OPERATIONAL_DATE_FORMAT)
			.setZone(timezone, { keepLocalTime: true })
			.set({ hour: 4, millisecond: 0, minute: 0, second: 0 }); // Start of the operational date
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.prototype.getOperationalDateInt(dateTime.toISO()),
			std_window: this.prototype.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Creates a Dates object from Unix epoch seconds
	 * @param seconds The number of seconds since Unix epoch
	 * @returns A new Dates object created from the seconds timestamp
	 */
	static fromSeconds(seconds: number): Dates {
		const dateTime = DateTime
			.fromSeconds(seconds)
			.setZone('utc', { keepLocalTime: false });
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.prototype.getOperationalDateInt(dateTime.toISO()),
			std_window: this.prototype.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Creates a Dates object from Unix epoch in milliseconds.
	 * @param millis The number of milliseconds since Unix epoch. Unix timestamp is always in UTC.
	 * @returns A new Dates object created from the milliseconds timestamp.
	 */
	static fromUnixMilliseconds(millis: number | UnixMilliseconds): Dates {
		const dateTime = DateTime
			.fromMillis(millis)
			.setZone('utc', { keepLocalTime: false });
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.prototype.getOperationalDateInt(dateTime.toISO()),
			std_window: this.prototype.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Creates a Dates object with the current date and time.
	 * @param timezone The timezone to set for the Dates object.
	 * @returns A new Dates object with the current date and time in the specified timezone.
	 */
	static now(timezone: 'local' | 'utc' | TimezoneIdentified): Dates {
		const dateTime = DateTime
			.now()
			.setZone(timezone, { keepLocalTime: false });
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.prototype.getOperationalDateInt(dateTime.toISO()),
			std_window: this.prototype.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Returns the difference between this date and another date.
	 * @param other The other Dates object to compare with
	 * @param unit The unit of time to return the difference in (defaults to 'day')
	 * @returns The difference as a number in the specified unit
	 */
	diff(other: Dates, unit: DateTimeUnit = 'day'): number {
		if (!this.iso || !other.iso) throw new Error('ISO date is not set.');
		const thisDateTime = DateTime.fromISO(this.iso, { setZone: true });
		const otherDateTime = DateTime.fromISO(other.iso, { setZone: true });
		return thisDateTime.diff(otherDateTime, unit).as(unit);
	}

	/**
	 * Returns a new Dates object with the end of the specified unit.
	 * @param unit The unit to set the end of, e.g., 'day', 'month', 'year', etc.
	 * @returns A new Dates object with the end of the specified unit.
	 */
	endOf(unit: DateTimeUnit): Dates {
		if (!this.iso) throw new Error('ISO date is not set.');
		const dateTime = DateTime
			.fromISO(this.iso, { setZone: true })
			.endOf(unit);
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.getOperationalDateInt(dateTime.toISO()),
			std_window: this.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Returns a new Dates object with the current date and time minus a duration.
	 * @param duration The duration to subtract
	 * @returns A new Dates object with the current date and time minus a duration
	 */
	minus(duration: DurationObjectUnits): Dates {
		if (!this.iso) throw new Error('ISO date is not set.');
		const dateTime = DateTime
			.fromISO(this.iso, { setZone: true })
			.minus(duration);
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.getOperationalDateInt(dateTime.toISO()),
			std_window: this.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Returns a new Dates object with the current date and time plus a duration
	 * @param duration The duration to add
	 * @returns A new Dates object with the current date and time plus a duration
	 */
	plus(duration: DurationObjectUnits): Dates {
		if (!this.iso) throw new Error('ISO date is not set.');
		const dateTime = DateTime
			.fromISO(this.iso, { setZone: true })
			.plus(duration);
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.getOperationalDateInt(dateTime.toISO()),
			std_window: this.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Sets the date and time for the Dates object.
	 * @param dateOrTime The date or time to set, can be an object with DateObjectUnits or a string in ISO format.
	 * @returns The Dates object
	 */
	set(dateOrTime: DateObjectUnits): Dates {
		if (!this.iso) throw new Error('ISO date is not set.');
		const dateTime = DateTime
			.fromISO(this.iso, { setZone: true })
			.set(dateOrTime);
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.getOperationalDateInt(dateTime.toISO()),
			std_window: this.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Sets the timezone for the Dates object.
	 * @param timezone The timezone to set in the format of an IANA timezone.
	 * @param method The method to use for updating the timezone information.
	 *   - `offset_only` Updates only offset setting to the new timezone. The ISO string will show adjusted time components (hour, minutes, etc.) to their equivalent in the new timezone. The UTC value in milliseconds stays the same. The UNIX timestamp is the source of truth.
	 *   - `rebase_utc` Keeps the individual time components (hour, minutes, etc.) and updates the internal UTC value in milliseconds to reflect the change. The ISO string will show the same time components as before, but the UTC value in milliseconds will be adjusted to match the new timezone. The ISO string is the source of truth.
	 * @returns The Dates object
	 */
	setZone(timezone: 'local' | 'utc' | TimezoneIdentified, method: 'offset_only' | 'rebase_utc'): Dates {
		if (!this.iso) throw new Error('ISO date is not set.');
		const dateTime = DateTime
			.fromISO(this.iso, { setZone: true })
			.setZone(timezone, { keepLocalTime: method === 'rebase_utc' });
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.getOperationalDateInt(dateTime.toISO()),
			std_window: this.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Returns a new Dates object with the start of the specified unit.
	 * @param unit The unit to set the start of, e.g., 'day', 'month', 'year', etc.
	 * @returns A new Dates object with the start of the specified unit.
	 */
	startOf(unit: DateTimeUnit): Dates {
		if (!this.iso) throw new Error('ISO date is not set.');
		const dateTime = DateTime
			.fromISO(this.iso, { setZone: true })
			.startOf(unit);
		return new Dates({
			calendar_date: dateTime.toFormat(CALENDAR_DATE_FORMAT) as CalendarDate,
			iso: dateTime.toISO(),
			js_date: dateTime.toJSDate(),
			operational_date_int: this.getOperationalDateInt(dateTime.toISO()),
			std_window: this.getStandardWindowInterval(dateTime.toISO()),
			unix_milliseconds: dateTime.toMillis() as UnixMilliseconds,
			unix_seconds: dateTime.toUnixInteger() as UnixSeconds,
		});
	}

	/**
	 * Returns the time remaining until a given unix_milliseconds (in ms) from now,
	 * as an object with minutes, hours, and days (all as floats, not rounded).
	 * @param unixMilliseconds The target timestamp in milliseconds
	 * @returns { minutes: number, hours: number, days: number }
	 */
	timeUntil(unixMilliseconds: UnixMilliseconds): { days: number, hours: number, minutes: number } {
		// Calculate the difference in milliseconds
		const now = Date.now();
		const diffMs = unixMilliseconds - now;
		// Calculate the time remaining
		const minutes = diffMs / (1000 * 60);
		const hours = diffMs / (1000 * 60 * 60);
		const days = diffMs / (1000 * 60 * 60 * 24);
		// Return the time components
		return { days, hours, minutes };
	}

	/**
	 * Returns the date as a string in the specified format.
	 * @param format The format string (see Luxon tokens documentation)
	 * @param opts Optional formatting options (e.g., { locale: 'pt' })
	 * @returns The date as a string in the specified format
	 */
	toFormat(format: string, opts?: { locale?: string }): string {
		if (!this.iso) throw new Error('ISO date is not set.');
		const dateTime = DateTime.fromISO(this.iso, { setZone: true });
		return dateTime.setLocale(opts?.locale || 'pt').toFormat(format);
	}

	/**
	 * Returns the date as a string in the specified format.
	 * @param format The format string (see Luxon tokens documentation)
	 * @returns The date as a string in the specified format
	 */
	toLocaleString(format: DateFormat, locale?: string): string {
		if (!this.iso) throw new Error('ISO date is not set.');
		const dateTime = DateTime.fromISO(this.iso, { setZone: true });
		if (locale) dateTime.setLocale(locale);
		const dateFormatConfig = DateFormatConfigMap[format];
		if (!dateFormatConfig) throw new Error(`Invalid date format: ${format}`);
		return dateTime.toLocaleString(dateFormatConfig, { locale: locale });
	}

	/**
	 * Returns the operational date based on the provided timestamp and format.
	 * @param isoDate The ISO date string to calculate the operational date.
	 * @returns The operational date in the yyyyLLdd format.
	 */
	private getOperationalDateInt(isoDate: null | string): OperationalDateInt {
		// Skip if the ISO date is not set
		if (!isoDate) throw new Error('ISO date is not set.');
		// Get the date object
		const dateObject = DateTime.fromISO(isoDate, { setZone: true });
		// Check if the time is between 00:00 and 03:59.
		// The operational date is between 04:00 and 03:59 of the following day.
		let operationalDate: string;
		if (dateObject.hour < 4) {
			// If true, unwind the clock by 12 hours to
			// return the previous day in the yyyyLLdd format
			const previousDay = dateObject.minus({ hours: 12 });
			operationalDate = previousDay.toFormat(OPERATIONAL_DATE_FORMAT);
		} else {
			// Else, return the current day in the yyyyLLdd format
			operationalDate = dateObject.toFormat(OPERATIONAL_DATE_FORMAT);
		}
		// Return the date as an operational date
		return Number(operationalDate) as OperationalDateInt;
	}

	/**
	 * This function returns the start and end of the standard window interval for a given timestamp.
	 * The standard window interval is the period in which is possible to receive data for a given ride.
	 * Currently, the standard window starts 10 hours before and ends 10 hours after the scheduled ride start.
	 * @param isoDate The ISO date string to calculate the standard window interval.
	 * @returns An object containing the start and end of the standard window interval.
	 */
	private getStandardWindowInterval(isoDate: null | string): { end: UnixMilliseconds, start: UnixMilliseconds } {
		if (!isoDate) throw new Error('ISO date is not set.');
		const dateTime = DateTime.fromISO(isoDate, { setZone: true });
		// Get the start and end of the standard window interval
		const startMs = dateTime.minus({ hours: Dates.standardWindowHours }).startOf('hour').toMillis();
		const endMs = dateTime.plus({ hours: Dates.standardWindowHours }).endOf('hour').toMillis();
		// Return the start and end of the standard window interval
		return { end: endMs as UnixMilliseconds, start: startMs as UnixMilliseconds };
	}

	//
}
