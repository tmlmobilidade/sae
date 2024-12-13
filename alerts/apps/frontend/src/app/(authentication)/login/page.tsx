import LoginForm from '@/components/authentication/LoginForm';

import styles from './styles.module.css';

/* * */

export default async function Page() {
	return (
		<div className={styles.container}>
			<div className={styles.formContainer}>
				<LoginForm />
			</div>
		</div>
	);
}
