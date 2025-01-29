import AlertForm from "@/components/alert/AlertForm";
import { AlertDetailContextProvider } from "@/contexts/AlertDetail.context";

export default function Page() {
	return (
		<AlertDetailContextProvider>
			<AlertForm />
		</AlertDetailContextProvider>
	);
}
