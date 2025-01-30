"use client";

import { Badge, Button, Surface } from "@tmlmobilidade/ui";
import AlertSectionTitle from "../AlertSectionTitle";
import AlertSectionVisibility from "../AlertSectionVisibility";
import { IconUpload, IconTrash } from "@tabler/icons-react";
import AlertSectionValidity from "../AlertSectionValidity";
import AlertSectionCauseEffect from "../AlertSectionCauseEffect";
import AlertSectionReferences from "../AlertSectionReferences";
import { useAlertDetailContext } from "@/contexts/AlertDetail.context";

export default function AlertForm() {

    const { flags, actions, data } = useAlertDetailContext();
    return (
        <div style={{ backgroundColor: 'gray', height: '100vh' }}>
            {/* Header */}
            <Surface padding="sm" flexDirection="row" alignItems="center" justifyContent="space-between">
                <Badge variant="muted">{data.form.getValues().publish_status}</Badge>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="primary" disabled={!flags.canSave} onClick={actions.saveAlert}>
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