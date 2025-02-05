"use client";

import { Badge, Button, Surface, Text } from "@tmlmobilidade/ui";
import AlertSectionTitle from "../AlertSectionTitle";
import AlertSectionVisibility from "../AlertSectionVisibility";
import { IconUpload, IconTrash } from "@tabler/icons-react";
import AlertSectionValidity from "../AlertSectionValidity";
import AlertSectionCauseEffect from "../AlertSectionCauseEffect";
import AlertSectionReferences from "../AlertSectionReferences";
import { AlertDetailMode, useAlertDetailContext } from "@/contexts/AlertDetail.context";
import styles from "./styles.module.css";

export default function AlertForm() {

    const { flags, actions, data } = useAlertDetailContext();
    return (
        <div style={{ backgroundColor: 'gray', height: '100vh' }}>
            {/* Header */}
            <Surface padding="sm" flexDirection="row" alignItems="center" justifyContent="space-between">
                <div className={styles.headerContainer}>
                    <Badge variant="muted">{data.form.getValues().publish_status}</Badge>
                    <Text size="xl" weight="bold">{data.form.getValues()._id}</Text>    
                </div>
                <div className={styles.headerContainer}>
                    <Button variant="primary" disabled={!flags.canSave} onClick={actions.saveAlert}>
                        <IconUpload size={28} />
                        <div>{flags.mode === AlertDetailMode.CREATE ? 'Publicar' : 'Salvar'}</div>
                    </Button>
                    {flags.mode === AlertDetailMode.EDIT && (
                        <Button variant="danger" onClick={actions.deleteAlert}>
                            <IconTrash size={28} />
                            <div>Apagar</div>
                        </Button>
                        )}
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