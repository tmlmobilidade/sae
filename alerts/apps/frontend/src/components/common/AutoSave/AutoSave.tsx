/* * */

import BackButton from '@/components/common/BackButton';
import CloseButton from '@/components/common/CloseButton';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { useIdle } from '@mantine/hooks';
import { IconAlertTriangleFilled, IconDeviceFloppy } from '@tabler/icons-react';
import { useEffect } from 'react';

interface AutoSaveProps {
	closeType?: 'back' | 'close'
	interval?: number
	isDirty: boolean
	isErrorSaving: Error | null
	isErrorValidating: Error | null
	isLoading: boolean
	isSaving: boolean
	isValid: boolean
	onClose?: () => void
	onSave?: () => void
	onValidate?: () => void
}

/* * */
/* AUTOSAVE COMPONENT */
/* Pair of buttons that trigger an action on an interval and on click. */
/* * */

export default function AutoSave({ closeType = 'close', interval = 2000, isDirty, isErrorSaving, isErrorValidating, isLoading, isSaving, isValid, onClose, onSave, onValidate }: AutoSaveProps) {
	//

	const isIdle = useIdle(interval, { initialState: false });

	//
	// A. AUTOSAVE INTERVAL
	// Setup the autosave interval, by default of 1 second.
	// On each interval trigger, call the onSave() function.
	// On component unmount, clear the interval.

	useEffect(() => {
		// If form is valid, has changed, is not currently saving,
		// did not have an error saving and has a valid action to perform.
		if (isIdle && isValid && isDirty && !isSaving && !isErrorSaving && onSave) {
			console.log({

			});
			onSave();
		}
	}, [isIdle, isValid, isDirty]);

	//
	// B. RETRY (IS SAVING AFTER ERROR)
	// If form had an error saving, and the user clicked try again
	// then show the save button with a loading spinner.

	if (isErrorSaving && isSaving) {
		return (
			<Button color="red" leftSection={<IconAlertTriangleFilled size="20px" />} loading size="xs" variant="light">
				Salvar Alterações
			</Button>
		);
	}

	//
	// C. IS ERROR SAVING
	// If form had an error saving, the button expands
	// to make the error clearer. Autosave is disabled.

	if (isErrorSaving) {
		return (
			<Tooltip color="red" label={`Ocorreu um erro ao salvar as alterações: ${isErrorSaving.message}`} multiline position="bottom" withArrow>
				<Button color="red" leftSection={<IconAlertTriangleFilled size="20px" />} onClick={onSave} size="xs" variant="light">
					Salvar Alterações
				</Button>
			</Tooltip>
		);
	}

	//
	// D. IS LOADING OR IS SAVING
	// If form is empty and loading the data,
	// or if the form is saving display a loading spinner.
	// Read more about the distinction between isLoading and isValidating:
	// https://swr.vercel.app/docs/advanced/understanding#combining-with-isloading-and-isvalidating-for-better-ux

	if (isLoading || isSaving) {
		return <ActionIcon color="gray" loading={true} size="lg" variant="subtle" />;
	}

	//
	// E. IS ERROR VALIDATING
	// If form had an error loading or updating the data,
	// the button changes to the alert icon but does not expand.

	if (isErrorValidating) {
		return (
			<Tooltip color="red" label={`Ocorreu um erro ao atualizar: ${isErrorValidating.message}`} multiline position="bottom" withArrow>
				<ActionIcon color="red" size="lg" variant="light">
					<IconAlertTriangleFilled size="20px" />
				</ActionIcon>
			</Tooltip>
		);
	}

	//
	// F. IS DIRTY AND iS INVALID
	// If the form has changes but is in an invalid state,
	// both the close and save buttons are disabled.

	if (isDirty && !isValid) {
		return (
			<Tooltip color="gray" label="Erro de Preenchimento" position="bottom" withArrow>
				<ActionIcon color="gray" onClick={onValidate} size="lg" variant="subtle">
					<IconDeviceFloppy size="20px" />
				</ActionIcon>
			</Tooltip>
		);
	}

	//
	// G. IS DIRTY AND iS VALID
	// If the form has changes and is valid, the close button is disabled
	// and the save button is clickable, waiting the autosave interval trigger.

	if (isDirty && isValid) {
		return (
			<Tooltip color="green" label="Guardar Alterações" position="bottom" withArrow>
				<ActionIcon color="green" onClick={onSave} size="lg" variant="light">
					<IconDeviceFloppy size="20px" />
				</ActionIcon>
			</Tooltip>
		);
	}

	//
	// H. IDLE
	// If the form has no unsaved changes, is valid and is not loading,
	// then the close button is enabled and the save button shows a reassuring icon and message.

	if (closeType === 'back') return <BackButton onClick={onClose} />;
	if (closeType === 'close') return <CloseButton onClick={onClose} />;

	//
}
