"use client";

import { History, MoreVertical } from "lucide-react";
// components
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import type { CitaFila } from "../actions/getCitasPendientes.action";

export function CitaAccionesMenu({ cita, onVerHistorial }: {
    cita: CitaFila;
    onVerHistorial: (cita: CitaFila) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Más acciones">
                    <MoreVertical size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onVerHistorial(cita)}>
                    <History size={14} />
                    Ver historial de llamadas
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
