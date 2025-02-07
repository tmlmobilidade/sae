'use client';

import AlertSectionCauseEffect from '../AlertSectionCauseEffect';
import AlertSectionReferences from '../AlertSectionReferences';
import AlertSectionTitle from '../AlertSectionTitle';
import AlertSectionValidity from '../AlertSectionValidity';
import AlertSectionVisibility from '../AlertSectionVisibility';
import Header from '../Header';

export default function AlertForm() {
	return (
		<>
			{/* Header */}
			<Header />
			{/* Title & Description */}
			<AlertSectionTitle />
			{/* Visibility Scheduling */}
			<AlertSectionVisibility />
			{/* Validity Scheduling */}
			<AlertSectionValidity />
			{/* Cause & Effect */}
			<AlertSectionCauseEffect />
			{/* References */}
			<AlertSectionReferences />
		</>
	);
}
