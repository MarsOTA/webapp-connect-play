import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit2, Save, X, UserPlus } from "lucide-react";
import { useAppStore, type AssegnazioneOperatore, type TurnoRichiesta } from "@/store/appStore";

interface AssegnazioneOperatoreRowProps {
  assegnazione: AssegnazioneOperatore;
  operators: Array<{ id: string; name: string }>;
  turno: TurnoRichiesta;
}

export const AssegnazioneOperatoreRow: React.FC<AssegnazioneOperatoreRowProps> = ({
  assegnazione,
  operators,
  turno,
}) => {
  const [editingTimes, setEditingTimes] = useState(false);
  const [tempStartTime, setTempStartTime] = useState(assegnazione.startTime);
  const [tempEndTime, setTempEndTime] = useState(assegnazione.endTime);

  const updateAssegnazioneOperatore = useAppStore((s) => s.updateAssegnazioneOperatore);
  const deleteAssegnazioneOperatore = useAppStore((s) => s.deleteAssegnazioneOperatore);

  const handleSaveTime = () => {
    updateAssegnazioneOperatore(assegnazione.id, {
      startTime: tempStartTime,
      endTime: tempEndTime,
    });
    setEditingTimes(false);
  };

  const handleCancelEditTime = () => {
    setTempStartTime(assegnazione.startTime);
    setTempEndTime(assegnazione.endTime);
    setEditingTimes(false);
  };

  const handleOperatorChange = (operatorId: string) => {
    if (operatorId === "" || operatorId === "unassigned") {
      // Remove assignment
      deleteAssegnazioneOperatore(assegnazione.id);
    } else {
      updateAssegnazioneOperatore(assegnazione.id, { operatoreId: operatorId });
    }
  };

  const handleTeamLeaderChange = (checked: boolean) => {
    updateAssegnazioneOperatore(assegnazione.id, { isTeamLeader: checked });
  };

  const getOperatorName = (id: string) => operators.find((o) => o.id === id)?.name || id;
  const isAssigned = assegnazione.operatoreId && assegnazione.operatoreId.trim() !== "";

  return (
    <tr className="bg-background border-l-4 border-l-accent/30">
      <td className="p-4 pl-12">
        <div className="text-sm text-muted-foreground">
          {turno.date.split("-").reverse().join("/")}
        </div>
      </td>
      <td className="p-4">
        {editingTimes ? (
          <div className="flex items-center gap-1">
            <Input
              type="time"
              value={tempStartTime}
              onChange={(e) => setTempStartTime(e.target.value)}
              className="w-20 text-xs"
            />
            <Button size="sm" variant="ghost" onClick={handleSaveTime}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEditTime}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">{assegnazione.startTime}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingTimes(true)}
              className="p-1"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </td>
      <td className="p-4">
        {editingTimes ? (
          <Input
            type="time"
            value={tempEndTime}
            onChange={(e) => setTempEndTime(e.target.value)}
            className="w-20 text-xs"
          />
        ) : (
          <span className="text-sm">{assegnazione.endTime}</span>
        )}
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">
          {turno.activityType || "Non specificato"}
        </div>
      </td>
      <td className="p-4">
        {isAssigned ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {getOperatorName(assegnazione.operatoreId)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAssegnazioneOperatore(assegnazione.id)}
              className="p-1"
              aria-label={`Rimuovi ${getOperatorName(assegnazione.operatoreId)}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Select onValueChange={handleOperatorChange} value={assegnazione.operatoreId || ""}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Seleziona operatore" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Non assegnato</SelectItem>
              {operators
                .filter((op) => op.id !== assegnazione.operatoreId)
                .map((operator) => (
                  <SelectItem key={operator.id} value={operator.id}>
                    {operator.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      </td>
      <td className="p-4">
        {isAssigned ? (
          <Checkbox
            checked={assegnazione.isTeamLeader || false}
            onCheckedChange={handleTeamLeaderChange}
            aria-label={
              assegnazione.isTeamLeader
                ? "Rimuovi come team leader"
                : "Imposta come team leader"
            }
          />
        ) : (
          "-"
        )}
      </td>
      <td className="p-4">-</td>
      <td className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteAssegnazioneOperatore(assegnazione.id)}
          className="text-destructive hover:text-destructive p-1"
          aria-label="Elimina assegnazione"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  );
};