import { Badge, Button, Section, Surface, TextArea, TextInput } from "@tmlmobilidade/ui";
import AlertSectionTitle from "../AlertSectionTitle";
import AlertSectionVisibility from "../AlertSectionVisibility";
import { IconUpload, IconTrash } from "@tabler/icons-react";
import AlertSectionValidity from "../AlertSectionValidity";
import AlertSectionCauseEffect from "../AlertSectionCauseEffect";
import AlertSectionReferences from "../AlertSectionReferences";

export default function AlertForm() {
    return (
        <div style={{ backgroundColor: 'gray', height: '100vh' }}>
            {/* Header */}
            <Surface padding="sm" flexDirection="row" alignItems="center" justifyContent="space-between">
                <Badge variant="muted" style={{ height: '100%' }}>Rascunho</Badge>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="primary">
                        <IconUpload size={28} />
                        <div>Publicar</div>
                    </Button>
                    <Button variant="danger">
                        <IconTrash size={28} />
                        <div>Apagar</div>
                    </Button>
                </div>
            </Surface>
            {/* Title & Description */}
            <AlertSectionTitle />
            {/* Visibility Scheduling */}
            <AlertSectionVisibility />
            {/* Validity Scheduling */}
            <AlertSectionValidity />
            {/* Cause & Effect */}
            <AlertSectionCauseEffect />
            {/* References */}
            <AlertSectionReferences />
        </div>
    );

}