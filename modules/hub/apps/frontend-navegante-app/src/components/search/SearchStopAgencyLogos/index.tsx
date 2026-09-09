import { getAgencyInfo, getAgencyLogo } from '@/lib/agency-catalog';
import Image from 'next/image';

import styles from './styles.module.css';

/* * */

interface SearchStopAgencyLogosProps {
	agencyIds: string[]
}

/* * */

export function SearchStopAgencyLogos({ agencyIds }: SearchStopAgencyLogosProps) {
	return (
		<em className={styles.stopAgencyLogos}>
			{agencyIds.map((agencyId) => {
				const agency = getAgencyInfo(agencyId);
				const agencyLogo = getAgencyLogo(agencyId, '120x120', 'light');
				if (!agency || !agencyLogo) return null;

				return (
					<Image
						key={agencyId}
						alt={agency.fullName}
						height={24}
						src={agencyLogo}
						width={24}
					/>
				);
			})}
		</em>
	);
}
