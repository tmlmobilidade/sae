import { type ClassValue, clsx } from 'clsx';

export default function combineClasses(...inputs: ClassValue[]) {
	return clsx(inputs);
}
