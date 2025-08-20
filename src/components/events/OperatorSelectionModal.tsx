import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Crown, Users } from "lucide-react";
import { useAppStore } from "@/store/appStore";

interface OperatorSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedOperators: string[], teamLeaderId?: string) => void;
  eventId: string;
  existingShiftOperators?: string[];
}

const OperatorSelectionModal = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  eventId,
  existingShiftOperators = []
}: OperatorSelectionModalProps) => {
  const operators = useAppStore(s => s.operators);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [teamLeaderId, setTeamLeaderId] = useState<string>("");

  const handleOperatorToggle = (operatorId: string) => {
    setSelectedOperators(prev => {
      const newSelected = prev.includes(operatorId) 
        ? prev.filter(id => id !== operatorId)
        : [...prev, operatorId];
      
      // If operator is deselected and was team leader, clear team leader
      if (!newSelected.includes(operatorId) && teamLeaderId === operatorId) {
        setTeamLeaderId("");
      }
      
      return newSelected;
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedOperators, teamLeaderId || undefined);
    handleClose();
  };

  const handleClose = () => {
    setSelectedOperators([]);
    setTeamLeaderId("");
    onOpenChange(false);
  };

  const getOperatorName = (operator: any) => {
    // Convert "Nome Cognome" to "Cognome Nome" format
    const nameParts = operator.name.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts.slice(0, -1).join(' ');
      const lastName = nameParts[nameParts.length - 1];
      return `${lastName} ${firstName}`;
    }
    return operator.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seleziona Operatori
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Operator Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Operatori disponibili:</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {operators
                .filter(op => !existingShiftOperators.includes(op.id))
                .map((operator) => (
                <div key={operator.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`operator-${operator.id}`}
                    checked={selectedOperators.includes(operator.id)}
                    onCheckedChange={() => handleOperatorToggle(operator.id)}
                  />
                  <Label 
                    htmlFor={`operator-${operator.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {getOperatorName(operator)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Team Leader Selection */}
          {selectedOperators.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Team Leader (opzionale):
              </h4>
              <RadioGroup value={teamLeaderId} onValueChange={setTeamLeaderId}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="no-leader" />
                  <Label htmlFor="no-leader" className="text-sm">Nessun team leader</Label>
                </div>
                {selectedOperators.map((operatorId) => {
                  const operator = operators.find(op => op.id === operatorId);
                  if (!operator) return null;
                  
                  return (
                    <div key={operatorId} className="flex items-center space-x-2">
                      <RadioGroupItem value={operatorId} id={`leader-${operatorId}`} />
                      <Label htmlFor={`leader-${operatorId}`} className="text-sm">
                        {getOperatorName(operator)}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Annulla
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedOperators.length === 0}
            >
              Conferma ({selectedOperators.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OperatorSelectionModal;