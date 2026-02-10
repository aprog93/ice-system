"use client";

import React, { useRef } from "react";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ActaExtranjeriaPreview } from "./ActaExtranjeriaPreview";
import type { ActaExtranjeria, Profesor, Pais } from "@/types";

interface ActaExtranjeriaPreviewModalProps {
    acta: ActaExtranjeria & {
        profesor?: Profesor;
        paisDestino?: Pais;
    };
    triggerLabel?: string;
}

export const ActaExtranjeriaPreviewModal: React.FC<
    ActaExtranjeriaPreviewModalProps
> = ({ acta, triggerLabel = "Vista Previa" }) => {
    const [open, setOpen] = React.useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (previewRef.current) {
            const printWindow = window.open("", "", "height=800,width=900");
            if (printWindow) {
                printWindow.document.write(previewRef.current.innerHTML);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    aria-label="Abrir vista previa del acta de extranjería"
                >
                    <FileText className="h-4 w-4" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>
                            Vista Previa - Acta {acta.numeroActa}/{acta.ano}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handlePrint}
                            aria-label="Imprimir acta"
                            className="h-auto p-2"
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div ref={previewRef} className="mt-4 bg-white">
                    <ActaExtranjeriaPreview acta={acta} />
                </div>
            </DialogContent>
        </Dialog>
    );
};
