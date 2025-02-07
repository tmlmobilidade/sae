import AlertForm from "@/components/AlertDetail/AlertForm";
import { AlertDetailContextProvider } from "@/contexts/AlertDetail.context";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return (
		<AlertDetailContextProvider alertId={id}>
			<AlertForm />
		</AlertDetailContextProvider>
	);
}
