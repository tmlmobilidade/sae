import AlertList from '@/components/AlertList';
import { AlertListContextProvider } from '@/contexts/AlertList.context';

export default function Page() {
	return (
		<AlertListContextProvider>
			<AlertList />
		</AlertListContextProvider>
	);
}
