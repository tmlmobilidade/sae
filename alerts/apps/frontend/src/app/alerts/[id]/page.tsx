import AlertForm from "@/components/AlertDetail/AlertForm";
import { AlertDetailContextProvider } from "@/contexts/AlertDetail.context";

export default function Page() {
	return (
		<AlertDetailContextProvider>
			<AlertForm />
		</AlertDetailContextProvider>
	);
}
