import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAppStore, ACTIVITY_TYPES, type ActivityType } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Users, Crown, UserPlus, Plus, Trash2, Edit2, Save, X, FileText, ArrowUpDown, ArrowUp, ArrowDown, ListChecks, Clock, Building2, MapPin, Calendar, Badge, Copy, Phone } from "lucide-react";
import OperatorAssignDialog from "@/components/events/OperatorAssignDialog";
import OperatorSelectionModal from "@/components/events/OperatorSelectionModal";
import ShiftPlanningForm from "@/components/events/ShiftPlanningForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const event = useAppStore(s => s.getEventById(id!));
  const clients = useAppStore(s => s.clients);
  const brands = useAppStore(s => s.brands);
  const operators = useAppStore(s => s.operators);
  const createShift = useAppStore(s => s.createShift);
  const assignOperators = useAppStore(s => s.assignOperators);
  const setOperatorSlot = useAppStore(s => s.setOperatorSlot);
  const removeOperator = useAppStore(s => s.removeOperator);
  const updateEvent = useAppStore(s => s.updateEvent);
  const setTeamLeader = useAppStore(s => s.setTeamLeader);
  const updateShiftNotes = useAppStore(s => s.updateShiftNotes);
  const updateShiftTime = useAppStore(s => s.updateShiftTime);
  const updateShiftActivityType = useAppStore(s => s.updateShiftActivityType);
  const deleteShift = useAppStore(s => s.deleteShift);
  
  const shifts = useAppStore(s => s.getShiftsByEvent(id!));
  
  const [assignOpen, setAssignOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<string | null>(null);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [slotTimes, setSlotTimes] = useState<Record<string, { startTime: string; endTime: string }>>({});
  const [editingPhones, setEditingPhones] = useState<Record<string, string>>({});
  const [slotNotes, setSlotNotes] = useState<Record<string, string>>({});

  if (!event) return (
    <main className="container py-8">
      <p className="text-muted-foreground">Evento non trovato.</p>
    </main>
  );

  const [operatorSelectionOpen, setOperatorSelectionOpen] = useState(false);
  const [pendingShiftData, setPendingShiftData] = useState<any>(null);

  const handleShiftSubmit = (values: any) => {
    const d = `${values.date.getFullYear()}-${String(values.date.getMonth() + 1).padStart(2, "0")}-${String(values.date.getDate()).padStart(2, "0")}`;
    
    setPendingShiftData({
      eventId: event.id,
      date: d,
      startTime: values.startTime,
      endTime: values.endTime,
      activityType: values.activityType as ActivityType,
    });
    setOperatorSelectionOpen(true);
  };

  const handleOperatorSelection = (selectedOperators: string[], teamLeaderId?: string) => {
    if (pendingShiftData && selectedOperators.length > 0) {
      createShift({
        ...pendingShiftData,
        operatorIds: selectedOperators,
        teamLeaderId,
        requiredOperators: selectedOperators.length
      });
    }
    setPendingShiftData(null);
  };

  const onAssign = (selectedIds: string[]) => {
    if (currentShift && currentSlotIndex !== null) {
      if (selectedIds.length === 0 || selectedIds[0] === "") {
        setOperatorSlot(currentShift, currentSlotIndex, "");
      } else {
        setOperatorSlot(currentShift, currentSlotIndex, selectedIds[0]);
      }
    }
    setAssignOpen(false);
    setCurrentShift(null);
    setCurrentSlotIndex(null);
  };

  const getOperatorName = (id: string) => {
    const operator = operators.find(o => o.id === id);
    if (!operator) return id;
    
    // Convert "Nome Cognome" to "Cognome Nome" format
    const nameParts = operator.name.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts.slice(0, -1).join(' ');
      const lastName = nameParts[nameParts.length - 1];
      return `${lastName} ${firstName}`;
    }
    return operator.name;
  };

  const getOperatorPhone = (id: string) => {
    const operator = operators.find(o => o.id === id);
    return operator?.phone || "-";
  };

  const calculateHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    
    // Handle overnight shifts (e.g., 20:00 to 03:00)
    if (end.getTime() < start.getTime()) {
      end = new Date(`2000-01-02T${endTime}`); // Add one day to end time
    }
    
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  const handleSaveNotes = (noteKey: string) => {
    if (noteKey.includes('-')) {
      // It's a slot-specific note
      setSlotNotes(prev => ({ ...prev, [noteKey]: tempNotes }));
    } else {
      // It's a shift note
      updateShiftNotes(noteKey, tempNotes);
    }
    setEditingNotes(null);
  };

  const handleCancelEditNotes = () => {
    setTempNotes("");
    setEditingNotes(null);
  };

  const handleToggleTeamLeader = (shiftId: string, operatorId: string, isCurrentLeader: boolean) => {
    if (isCurrentLeader) {
      setTeamLeader(shiftId, "");
    } else {
      setTeamLeader(shiftId, operatorId);
    }
  };

  const handleDuplicateShift = (shift: any, operatorId: string) => {
    createShift({
      eventId: event.id,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      operatorIds: [""], // No operator assigned to duplicate
      activityType: shift.activityType,
      requiredOperators: 1,
      notes: shift.notes
    });
  };

  // Ordinamento tabella turni per cognome operatore
  const [sort, setSort] = useState<{ key: 'date' | 'activityType' | 'operator' | 'startTime' | 'endTime' | 'hours'; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'asc' });
  
  const toggleSort = (key: 'date' | 'activityType' | 'operator' | 'startTime' | 'endTime' | 'hours') =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  // Flatten shifts to individual rows for each operator
  const flattenedShifts = useMemo(() => {
    const rows: any[] = [];
    shifts.forEach(shift => {
      shift.operatorIds.forEach((operatorId, slotIndex) => {
        rows.push({
          ...shift,
          operatorId,
          slotIndex,
          isAssigned: operatorId && operatorId.trim() !== ""
        });
      });
    });
    return rows;
  }, [shifts]);

  const sortedShifts = useMemo(() => {
    const arr = [...flattenedShifts];
    arr.sort((a, b) => {
      let va = '', vb = '';
      if (sort.key === 'date') { va = a.date; vb = b.date; }
      if (sort.key === 'activityType') { va = a.activityType || ''; vb = b.activityType || ''; }
      if (sort.key === 'operator') { 
        va = a.isAssigned ? getOperatorName(a.operatorId) : '';
        vb = b.isAssigned ? getOperatorName(b.operatorId) : '';
      }
      if (sort.key === 'startTime') { va = a.startTime; vb = b.startTime; }
      if (sort.key === 'endTime') { va = a.endTime; vb = b.endTime; }
      if (sort.key === 'hours') { 
        va = calculateHours(a.startTime, a.endTime);
        vb = calculateHours(b.startTime, b.endTime);
      }
      const comp = va.localeCompare(vb);
      return sort.dir === 'asc' ? comp : -comp;
    });
    return arr;
  }, [flattenedShifts, sort, operators]);

  return (
    <main className="container py-8">
      <Helmet>
        <title>{event.title} | Evento</title>
        <meta name="description" content={`Dettaglio evento ${event.title}. Pianifica turni e assegna operatori.`} />
        <link rel="canonical" href={`/events/${event.id}`} />
      </Helmet>

      {/* Event info header and shift planning */}
      <section className="mb-8">
        <div className="flex gap-8">
          {/* Left side - Event details (40%) */}
          <div className="flex-[0_0_40%]">
            <h1 className="mb-6 text-3xl font-extrabold font-mulish" style={{ color: "#72AD97" }}>{event.title}</h1>
            
            {/* Event details under title */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5" style={{ color: '#72AD97', backgroundColor: 'transparent' }} />
                <Input
                  value={event.address}
                  onChange={(e) => updateEvent(event.id, { address: e.target.value })}
                  className="flex-1 h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                  placeholder="Viale Montenapeoleone 10, Milano"
                />
              </div>
              
              
              <div className="flex items-center gap-3">
                <Badge className="h-5 w-5" style={{ color: '#72AD97', backgroundColor: 'transparent' }} />
                <Input
                  value={event.activityCode || ''}
                  onChange={(e) => updateEvent(event.id, { activityCode: e.target.value })}
                  className="flex-1 h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                  placeholder="Codice attività"
                />
              </div>
            </div>
          </div>

          {/* Right side - Shift Planning Form (60%) */}
          <div className="flex-[0_0_60%]">
            <ShiftPlanningForm onSubmit={handleShiftSubmit} />
          </div>
        </div>
      </section>

      {/* Shifts by Date Groups */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="mt-6 text-2xl font-extrabold font-mulish" style={{ color: "#72AD97" }}>LISTA TURNI EVENTO</h2>
        </div>
        
        {/* Group shifts by date */}
        {Object.entries(
          sortedShifts.reduce((groups: Record<string, any[]>, shift: any) => {
            const date = shift.date;
            if (!groups[date]) groups[date] = [];
            groups[date].push(shift);
            return groups;
          }, {} as Record<string, any[]>)
        ).map(([date, dateShifts]: [string, any[]]) => {
          // Calculate total hours for this date
          const totalHours = dateShifts.reduce((sum: number, shift: any) => {
            const hours = calculateHours(
              slotTimes[`${shift.id}-${shift.slotIndex}`]?.startTime || shift.startTime,
              slotTimes[`${shift.id}-${shift.slotIndex}`]?.endTime || shift.endTime
            );
            return sum + parseFloat(hours);
          }, 0);

          return (
            <div key={date} className="mb-6">
              {/* Date Header */}
              <div className="flex items-center justify-between bg-muted/30 px-4 py-2 rounded-t-lg border border-b-0">
                <h3 className="text-lg font-semibold">
                  {new Date(date + 'T00:00:00').toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <div className="text-sm font-medium text-muted-foreground">
                  Ore totali: <span className="font-bold text-foreground">{totalHours.toFixed(1)}h</span>
                </div>
              </div>
              
              {/* Shifts Table for this date */}
              <div className="rounded-b-lg border border-border overflow-hidden">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('startTime')} className="px-0">
                          <span className="mr-2">ORA INIZIO</span>
                          {sort.key !== 'startTime' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('endTime')} className="px-0">
                          <span className="mr-2">ORA FINE</span>
                          {sort.key !== 'endTime' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                        </Button>
                      </TableHead>
                      <TableHead>TIPOLOGIA ATTIVITÀ</TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('operator')} className="px-0">
                          <span className="mr-2">OPERATORE</span>
                          {sort.key !== 'operator' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                        </Button>
                      </TableHead>
                      <TableHead>TELEFONO</TableHead>
                      <TableHead>TL</TableHead>
                      <TableHead>NOTE</TableHead>
                      <TableHead>AZIONI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dateShifts as any[]).map((row: any, index: number) => (
                      <TableRow 
                        key={`${row.id}-${row.slotIndex}`}
                        className="even:bg-muted transition-all duration-300 hover:bg-muted/80"
                      >
                        <TableCell>
                          <span className="text-sm">{slotTimes[`${row.id}-${row.slotIndex}`]?.startTime || row.startTime}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{slotTimes[`${row.id}-${row.slotIndex}`]?.endTime || row.endTime}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{row.activityType || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {row.isAssigned ? getOperatorName(row.operatorId) : "Non assegnato"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{row.isAssigned ? getOperatorPhone(row.operatorId) : "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.isAssigned && row.teamLeaderId === row.operatorId ? (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {editingNotes === `${row.id}-${row.slotIndex}` ? (
                            <div className="flex items-center gap-2">
                              <Textarea
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                className="min-h-[60px] text-sm"
                                placeholder="Inserisci note..."
                              />
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveNotes(`${row.id}-${row.slotIndex}`)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEditNotes}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                                {slotNotes[`${row.id}-${row.slotIndex}`] || row.notes || ""}
                              </span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  setEditingNotes(`${row.id}-${row.slotIndex}`);
                                  setTempNotes(slotNotes[`${row.id}-${row.slotIndex}`] || row.notes || "");
                                }}
                                aria-label="Modifica note"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (row.isAssigned) {
                                removeOperator(row.id, row.operatorId);
                                // Check if this was the last operator, if so delete the shift
                                const shift = shifts.find(s => s.id === row.id);
                                if (shift && shift.operatorIds.filter(id => id && id.trim() !== "" && id !== row.operatorId).length === 0) {
                                  deleteShift(row.id);
                                }
                              } else {
                                deleteShift(row.id);
                              }
                            }}
                            className="text-destructive hover:text-destructive"
                            aria-label="Elimina riga"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(dateShifts as any[]).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nessun turno per questa data.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
        
        {sortedShifts.length === 0 && (
          <div className="text-center text-muted-foreground py-8 border border-border rounded-lg">
            Nessun turno pianificato. Crea il primo turno.
          </div>
        )}
      </section>

      {/* Dialog per modificare note */}
      <Dialog open={!!editingNotes} onOpenChange={() => setEditingNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Note Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea 
              value={tempNotes} 
              onChange={e => setTempNotes(e.target.value)} 
              placeholder="Inserisci note per il turno" 
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEditNotes}>
                Annulla
              </Button>
              <Button onClick={() => editingNotes && handleSaveNotes(editingNotes)}>
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OperatorAssignDialog 
        open={assignOpen} 
        onOpenChange={setAssignOpen} 
        operators={currentShift ? operators.filter(op => !shifts.find(s => s.id === currentShift)?.operatorIds.includes(op.id)) : operators} 
        onConfirm={onAssign} 
      />

      <OperatorSelectionModal
        open={operatorSelectionOpen}
        onOpenChange={setOperatorSelectionOpen}
        onConfirm={handleOperatorSelection}
        eventId={event.id}
        existingShiftOperators={shifts.flatMap(s => s.operatorIds).filter(Boolean)}
      />
    </main>
  );
};

export default EventDetail;
