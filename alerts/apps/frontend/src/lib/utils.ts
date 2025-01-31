import clsx from 'clsx';
import { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

export function toggleArray<T>(array: T[], value: T) {
	if (array.includes(value)) {
		return array.filter((v) => v !== value);
	}
	return [...array, value];
}