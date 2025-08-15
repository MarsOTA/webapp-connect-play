import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Scissors 
} from "lucide-react";
import { useAppStore, type TurnoRichiesta, type AssegnazioneOperatore } from "@/store/appStore";
import { TimelineCoverage } from "./TimelineCoverage";
import { AssegnazioneOperatoreRow } from "./AssegnazioneOperatoreRow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TurnoRichiestaRowProps {
  turno: TurnoRichiesta;
  assegnazioni: AssegnazioneOperatore[];
  operators: Array<{ id: string; name: string }>;
  onFillGap: (turnoId: string, gapStart: string, gapEnd: string) => void;
}

export const TurnoRichiestaRow: React.FC<TurnoRichiestaRowProps> = ({
  turno,
  assegnazioni,
  operators,
  onFillGap,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState(turno.notes || "");
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [splitTime, setSplitTime] = useState("");

  const updateTurnoRichiesta = useAppStore((s) => s.updateTurnoRichiesta);
  const deleteTurnoRichiesta = useAppStore((s) => s.deleteTurnoRichiesta);
  const splitTurnoRichiesta = useAppStore((s) => s.splitTurnoRichiesta);
  const createAssegnazioneOperatore = useAppStore((s) => s.createAssegnazioneOperatore);

  const handleSaveNotes = () => {
    updateTurnoRichiesta(turno.id, { notes: tempNotes });
    setEditingNotes(false);
  };

  const handleCancelEditNotes = () => {
    setTempNotes(turno.notes || "");
    setEditingNotes(false);
  };

  const handleSplitTurno = () => {
    if (!splitTime) return;
    
    try {
      splitTurnoRichiesta(turno.id, splitTime);
      setShowSplitDialog(false);
      setSplitTime("");
    } catch (error) {
      console.error("Error splitting turno:", error);
    }
  };

  const handleFillGap = (gapStart: string, gapEnd: string) => {
    onFillGap(turno.id, gapStart, gapEnd);
  };

  const handleAddAssegnazione = () => {
    // Create empty assignment for user to fill
    createAssegnazioneOperatore({
      turnoId: turno.id,
      operatoreId: "",
      startTime: turno.startTime,
      endTime: turno.endTime,
    });
  };

  const hasEarlyEndingAssignments = assegnazioni.some(
    (a) => a.endTime < turno.endTime
  );

  return (
    <>
      {/* Parent row */}
      <tr className="bg-accent/10 border-b-2 border-accent/20">
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <span className="font-medium">
              {turno.date.split("-").reverse().join("/")}
            </span>
            <Badge variant="outline" className="text-xs">
              {assegnazioni.length}/{turno.operatoriRichiesti}
            </Badge>
          </div>
        </td>
        <td className="p-4">
          <Input
            type="time"
            value={turno.startTime}
            onChange={(e) =>
              updateTurnoRichiesta(turno.id, { startTime: e.target.value })
            }
            className="w-24 text-sm"
          />
        </td>
        <td className="p-4">
          <Input
            type="time"
            value={turno.endTime}
            onChange={(e) =>
              updateTurnoRichiesta(turno.id, { endTime: e.target.value })
            }
            className="w-24 text-sm"
          />
        </td>
        <td className="p-4">
          <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-2 rounded">
            {turno.activityType || "Non specificato"}
          </div>
        </td>
        <td colSpan={3} className="p-4">
          <TimelineCoverage
            turnoId={turno.id}
            onFillGap={handleFillGap}
          />
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {turno.notes && turno.notes.trim() !== "" ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingNotes(true);
                  setTempNotes(turno.notes || "");
                }}
                aria-label="Visualizza/Modifica note"
                title={turno.notes}
              >
                <FileText className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingNotes(true)}
                aria-label="Aggiungi note"
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}

            {hasEarlyEndingAssignments && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSplitDialog(true)}
                aria-label="Dividi turno"
              >
                <Scissors className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTurnoRichiesta(turno.id)}
              className="text-destructive hover:text-destructive"
              aria-label="Elimina turno"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>

      {/* Child rows */}
      {isExpanded && (
        <>
          {assegnazioni.map((assegnazione) => (
            <AssegnazioneOperatoreRow
              key={assegnazione.id}
              assegnazione={assegnazione}
              operators={operators}
              turno={turno}
            />
          ))}
          
          {/* Add new assignment row */}
          <tr className="bg-accent/5">
            <td className="p-4 pl-12">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddAssegnazione}
                className="text-xs"
              >
                + Aggiungi operatore
              </Button>
            </td>
            <td colSpan={7}></td>
          </tr>
        </>
      )}

      {/* Notes dialog */}
      <Dialog open={editingNotes} onOpenChange={setEditingNotes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Note Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Inserisci note per il turno"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEditNotes}>
                Annulla
              </Button>
              <Button onClick={handleSaveNotes}>Salva</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Split dialog */}
      <Dialog open={showSplitDialog} onOpenChange={setShowSplitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dividi Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Inserisci l'orario di divisione del turno:
            </p>
            <Input
              type="time"
              value={splitTime}
              onChange={(e) => setSplitTime(e.target.value)}
              min={turno.startTime}
              max={turno.endTime}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSplitDialog(false)}
              >
                Annulla
              </Button>
              <Button onClick={handleSplitTurno} disabled={!splitTime}>
                Dividi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};