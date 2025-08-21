import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Users, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [searchTerm, setSearchTerm] = useState("");

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
    setSearchTerm("");
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

  const filteredOperators = operators
    .filter(op => !existingShiftOperators.includes(op.id))
    .filter(op => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return op.name.toLowerCase().includes(searchLower) || 
             (op.role && op.role.toLowerCase().includes(searchLower));
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assegna operatori
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Seleziona uno o più operatori da assegnare al turno. Puoi selezionare fino al numero di operatori richiesti.
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca operatore per nome o ruolo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Operators Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nome Operatore</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Disponibilità</TableHead>
                  <TableHead className="w-16">TL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Non assegnato option */}
                <TableRow className="bg-muted/20">
                  <TableCell>
                    <Checkbox
                      checked={selectedOperators.includes("")}
                      onCheckedChange={() => handleOperatorToggle("")}
                    />
                  </TableCell>
                  <TableCell className="font-medium">Non assegnato</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
                
                {/* Operator rows */}
                {filteredOperators.map((operator) => (
                  <TableRow key={operator.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOperators.includes(operator.id)}
                        onCheckedChange={() => handleOperatorToggle(operator.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{getOperatorName(operator)}</TableCell>
                    <TableCell>{operator.role || "Non specificato"}</TableCell>
                    <TableCell>
                      <span className="text-green-600">Disponibile</span>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={teamLeaderId === operator.id}
                        onCheckedChange={(checked) => {
                          if (checked && selectedOperators.includes(operator.id)) {
                            setTeamLeaderId(operator.id);
                          } else {
                            setTeamLeaderId("");
                          }
                        }}
                        disabled={!selectedOperators.includes(operator.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Annulla
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedOperators.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              Assegna operatore
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OperatorSelectionModal;