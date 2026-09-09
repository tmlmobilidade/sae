'use client';

import { LineBadge } from '@/components/lines/common/LineBadge';
import { useLinesDetailContext } from '@/components/lines/detail/LinesDetail.context';
import { getAgencyLogo } from '@/lib/agency-catalog';
import { Section, Surface } from '@tmlmobilidade/ui';
import Image from 'next/image';

import styles from './styles.module.css';

/* * */

export function LinesDetailViewHeader() {
	//

	//
	// A. Setup variables

	const linesDetailContext = useLinesDetailContext();
	const agencyLogo = getAgencyLogo(linesDetailContext.data.line.agency_id, '180x120', 'light');

	//
	// B. Render componentss

	return (
		<Surface variant="plain">
			<Section gap="sm">
				<div aria-hidden={true} className={styles.row}>
					<LineBadge lineData={linesDetailContext.data.line} size="lg" />
					{agencyLogo && <Image alt="" height={40} src={agencyLogo} width={60} />}
				</div>
				<h1 aria-hidden={true} className={styles.lineName}>
					{linesDetailContext.data.line.long_name}
				</h1>
			</Section>
		</Surface>
	);
}
