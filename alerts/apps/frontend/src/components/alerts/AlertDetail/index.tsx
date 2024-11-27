import AlertImage from '../AlertImage';
import AlertInfo from '../AlertInfo';
import AlertSchedule from '../AlertSchedule';
import styles from './styles.module.css';

/* * */

export default function AlertDetail() {
	return (
		<div className={styles.container}>
			<AlertInfo />
			<AlertImage />
			<AlertSchedule />
		</div>
	);
}
