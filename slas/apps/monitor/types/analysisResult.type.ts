/* eslint-disable @typescript-eslint/no-explicit-any */

/* * */

export interface AnalysisResult {
	code: string
	grade: AnalysisResultGrade
	message: null | string
	reason: null | string
	status: AnalysisResultStatus
	unit: null | string
	value: null | number | string
}

/* * */

export enum AnalysisResultGrade {
	FAIL = 'FAIL',
	PASS = 'PASS',
}

/* * */

export enum AnalysisResultStatus {
	COMPLETE = 'COMPLETE',
	ERROR = 'ERROR',
}
