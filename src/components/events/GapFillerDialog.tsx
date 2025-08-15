import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/appStore";

interface GapFillerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turnoId: string;
  gapStart: string;
  gapEnd: string;
  onConfirm: (operatorId: string) => void;
}

export const GapFillerDialog: React.FC<GapFillerDialogProps> = ({
  open,
  onOpenChange,
  turnoId,
  gapStart,
  gapEnd,
  onConfirm,
}) => {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");
  
  const operators = useAppStore((s) => s.operators);
  const getAssegnazioniByTurno = useAppStore((s) => s.getAssegnazioniByTurno);
  
  // Get operators that are not already assigned to this turno during this time range
  const assignedOperatorIds = getAssegnazioniByTurno(turnoId)
    .filter((a) => {
      // Check if assignment overlaps with gap
      const assignmentStart = a.startTime;
      const assignmentEnd = a.endTime;
      return !(assignmentEnd <= gapStart || assignmentStart >= gapEnd);
    })
    .map((a) => a.operatoreId);
  
  const availableOperators = operators.filter(
    (op) => !assignedOperatorIds.includes(op.id) && op.availability === "Disponibile"
  );

  const handleConfirm = () => {
    if (selectedOperatorId) {
      onConfirm(selectedOperatorId);
      setSelectedOperatorId("");
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedOperatorId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Riempi Gap {gapStart} - {gapEnd}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Seleziona un operatore disponibile per coprire questo orario:
          </p>
          
          <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona operatore" />
            </SelectTrigger>
            <SelectContent>
              {availableOperators.map((operator) => (
                <SelectItem key={operator.id} value={operator.id}>
                  {operator.name} - {operator.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {availableOperators.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nessun operatore disponibile per questo orario
            </p>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Annulla
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedOperatorId}
            >
              Assegna
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};