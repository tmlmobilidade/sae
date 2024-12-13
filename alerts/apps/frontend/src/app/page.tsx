import { redirect } from 'next/navigation';

export default async function Page() {
	redirect('/alerts');

	return <div>Jusi was here</div>;
}
