"use client";

import AlertSectionTitle from "../AlertSectionTitle";
import AlertSectionVisibility from "../AlertSectionVisibility";
import AlertSectionValidity from "../AlertSectionValidity";
import AlertSectionCauseEffect from "../AlertSectionCauseEffect";
import AlertSectionReferences from "../AlertSectionReferences";
import Header from "../Header";

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