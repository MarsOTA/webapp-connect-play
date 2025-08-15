import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAppStore, ACTIVITY_TYPES, type ActivityType } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Users, Crown, UserPlus, Plus, Trash2, Edit2, Save, X, FileText, ArrowUpDown, ArrowUp, ArrowDown, ListChecks, Clock } from "lucide-react";
import OperatorAssignDialog from "@/components/events/OperatorAssignDialog";
import ShiftPlanningForm from "@/components/events/ShiftPlanningForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { TurnoRichiestaRow } from "@/components/events/TurnoRichiestaRow";
import { GapFillerDialog } from "@/components/events/GapFillerDialog";
const EventDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const event = useAppStore(s => s.getEventById(id!));
  const clients = useAppStore(s => s.clients);
  const brands = useAppStore(s => s.brands);
  const operators = useAppStore(s => s.operators);
  
  // New timeline-based methods
  const createTurnoRichiesta = useAppStore(s => s.createTurnoRichiesta);
  const getTurniRichiestiByEvent = useAppStore(s => s.getTurniRichiestiByEvent);
  const getAssegnazioniByEvent = useAppStore(s => s.getAssegnazioniByEvent);
  const getAssegnazioniByTurno = useAppStore(s => s.getAssegnazioniByTurno);
  const fillGap = useAppStore(s => s.fillGap);
  
  // Legacy methods (keep for backward compatibility)
  const createShift = useAppStore(s => s.createShift);
  const assignOperators = useAppStore(s => s.assignOperators);
  const setOperatorSlot = useAppStore(s => s.setOperatorSlot);
  const removeOperator = useAppStore(s => s.removeOperator);
  const updateEventAddress = useAppStore(s => s.updateEventAddress);
  const updateEventActivityCode = useAppStore(s => s.updateEventActivityCode);
  const setTeamLeader = useAppStore(s => s.setTeamLeader);
  const updateShiftNotes = useAppStore(s => s.updateShiftNotes);
  const updateShiftTime = useAppStore(s => s.updateShiftTime);
  const updateShiftActivityType = useAppStore(s => s.updateShiftActivityType);
  const deleteShift = useAppStore(s => s.deleteShift);
  
  // State for gap filling
  const [gapFillerOpen, setGapFillerOpen] = useState(false);
  const [currentGap, setCurrentGap] = useState<{ turnoId: string; gapStart: string; gapEnd: string } | null>(null);
  
  // State for individual row time editing - each row has its own independent times
  const [rowTimes, setRowTimes] = useState<{[key: string]: {startTime: string, endTime: string}}>({});
  const [editingTimes, setEditingTimes] = useState<string | null>(null);
  
  // Get data using new timeline system
  const turniRichiesti = getTurniRichiestiByEvent(id!);
  const allAssegnazioni = getAssegnazioniByEvent(id!);
  
  // Legacy data (keep for backward compatibility)
  const shifts = useAppStore(s => s.getShiftsByEvent(id!));
  const clientName = useMemo(() => clients.find(c => c.id === event?.clientId)?.name, [clients, event]);
  const brandName = useMemo(() => brands.find(b => b.id === event?.brandId)?.name, [brands, event]);
  
  const [assignOpen, setAssignOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<string | null>(null);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(event?.address || "");
  const [activityCode, setActivityCode] = useState(event?.activityCode || "");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");

  // Calculate counters from new timeline system
  const totalOperatorsAssigned = allAssegnazioni.filter(a => a.operatoreId && a.operatoreId.trim() !== "").length;
  
  const totalAssignedHours = allAssegnazioni.reduce((total, assignment) => {
    if (!assignment.operatoreId || assignment.operatoreId.trim() === "") return total;
    const startTime = new Date(`2000-01-01T${assignment.startTime}`);
    const endTime = new Date(`2000-01-01T${assignment.endTime}`);
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);
  
  const totalEventHours = turniRichiesti.reduce((total, turno) => {
    const startTime = new Date(`2000-01-01T${turno.startTime}`);
    const endTime = new Date(`2000-01-01T${turno.endTime}`);
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return total + (hours * turno.operatoriRichiesti);
  }, 0);
  
  if (!event) return <main className="container py-8">
      <p className="text-muted-foreground">Evento non trovato.</p>
    </main>;

  const handleShiftSubmit = (values: any) => {
    const d = `${values.date.getFullYear()}-${String(values.date.getMonth() + 1).padStart(2, "0")}-${String(values.date.getDate()).padStart(2, "0")}`;
    
    // Create TurnoRichiesta instead of legacy Shift
    createTurnoRichiesta({
      eventId: event.id,
      date: d,
      startTime: values.startTime,
      endTime: values.endTime,
      operatoriRichiesti: values.numOperators,
      activityType: values.activityType as ActivityType,
      notes: values.notes || undefined
    });
  };

  const handleFillGap = (turnoId: string, gapStart: string, gapEnd: string) => {
    setCurrentGap({ turnoId, gapStart, gapEnd });
    setGapFillerOpen(true);
  };

  const handleGapFillConfirm = (operatorId: string) => {
    if (currentGap) {
      fillGap(currentGap.turnoId, currentGap.gapStart, currentGap.gapEnd, operatorId);
      setCurrentGap(null);
      setGapFillerOpen(false);
    }
  };

  const onAssign = (selectedIds: string[]) => {
    if (currentShift && currentSlotIndex !== null) {
      // Se selectedIds è vuoto o contiene stringa vuota, significa "Non assegnato"
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
  const handleSaveAddress = () => {
    updateEventAddress(event.id, tempAddress);
    setEditingAddress(false);
  };
  const handleCancelEditAddress = () => {
    setTempAddress(event?.address || "");
    setEditingAddress(false);
  };
  const getOperatorName = (id: string) => operators.find(o => o.id === id)?.name || id;
  const handleSaveNotes = (shiftId: string) => {
    updateShiftNotes(shiftId, tempNotes);
    setEditingNotes(null);
  };
  const handleCancelEditNotes = () => {
    setTempNotes("");
    setEditingNotes(null);
  };
  const handleToggleTeamLeader = (shiftId: string, operatorId: string, isCurrentLeader: boolean) => {
    if (isCurrentLeader) {
      // Remove team leader
      setTeamLeader(shiftId, "");
    } else {
      // Set as team leader
      setTeamLeader(shiftId, operatorId);
    }
  };

  // Ordinamento tabella turni
  const [sort, setSort] = useState<{ key: 'date' | 'startTime' | 'endTime'; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'asc' });
  const toggleSort = (key: 'date' | 'startTime' | 'endTime') =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const sortedShifts = useMemo(() => {
    const arr = [...shifts];
    arr.sort((a, b) => {
      let va = '', vb = '';
      if (sort.key === 'date') { va = a.date; vb = b.date; }
      if (sort.key === 'startTime') { va = a.startTime; vb = b.startTime; }
      if (sort.key === 'endTime') { va = a.endTime; vb = b.endTime; }
      const comp = va.localeCompare(vb);
      return sort.dir === 'asc' ? comp : -comp;
    });
    return arr;
  }, [shifts, sort]);

  return <main className="container py-8">
      <Helmet>
        <title>{event.title} | Evento</title>
        <meta name="description" content={`Dettaglio evento ${event.title}. Pianifica turni e assegna operatori.`} />
        <link rel="canonical" href={`/events/${event.id}`} />
      </Helmet>

      {/* Event info at top left, dashboards side by side */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <h1 className="font-semibold mb-2 text-4xl">{event.title}</h1>
          
          {/* Counters under title */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-accent/20 rounded-lg p-4 border border-accent/40">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Totale operatori assegnati</p>
                  <p className="text-xl font-semibold text-primary">
                    {totalOperatorsAssigned}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-accent/20 rounded-lg p-4 border border-accent/40">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Totale ore assegnate</p>
                  <p className="text-xl font-semibold text-primary">
                    {totalAssignedHours.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-accent/20 rounded-lg p-4 border border-accent/40">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Totale ore evento</p>
                  <p className="text-xl font-semibold text-primary">
                    {totalEventHours.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <span className="text-muted-foreground">Codice attività:</span>
            <Input 
              placeholder="Inserisci codice attività" 
              className="w-32" 
              value={activityCode}
              onChange={(e) => {
                setActivityCode(e.target.value);
                updateEventActivityCode(event.id, e.target.value);
              }}
            />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <ShiftPlanningForm onSubmit={handleShiftSubmit} />
        </div>
      </section>


      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <h2 className="font-bold text-2xl">LISTA TURNI EVENTO</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {event.startDate && event.endDate ? (
                  `dal ${event.startDate.split("-").reverse().join("/")} al ${event.endDate.split("-").reverse().join("/")}`
                ) : (
                  "Date evento non specificate"
                )}
              </span>
              <div className="flex items-center gap-2">
                {editingAddress ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={tempAddress} 
                      onChange={e => setTempAddress(e.target.value)} 
                      className="max-w-md h-8" 
                      placeholder="Inserisci indirizzo evento" 
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveAddress}>
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEditAddress}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{event.address || "Indirizzo non specificato"}</span>
                    <Button size="sm" variant="ghost" onClick={() => setEditingAddress(true)} aria-label="Modifica indirizzo">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ora Inizio</TableHead>
                <TableHead>Ora Fine</TableHead>
                <TableHead>Tipologia Attività</TableHead>
                <TableHead>Copertura Timeline</TableHead>
                <TableHead>Operatore</TableHead>
                <TableHead>TL</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turniRichiesti.length > 0 ? (
                turniRichiesti.map((turno) => {
                  const assegnazioni = getAssegnazioniByTurno(turno.id);
                  return (
                    <TurnoRichiestaRow
                      key={turno.id}
                      turno={turno}
                      assegnazioni={assegnazioni}
                      operators={operators}
                      onFillGap={handleFillGap}
                    />
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nessun turno pianificato. Crea il primo turno.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Dialog per modificare note */}
      <Dialog open={!!editingNotes} onOpenChange={() => setEditingNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Note Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea value={tempNotes} onChange={e => setTempNotes(e.target.value)} placeholder="Inserisci note per il turno" rows={4} />
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


      {/* Gap Filler Dialog */}
      {currentGap && (
        <GapFillerDialog
          open={gapFillerOpen}
          onOpenChange={setGapFillerOpen}
          turnoId={currentGap.turnoId}
          gapStart={currentGap.gapStart}
          gapEnd={currentGap.gapEnd}
          onConfirm={handleGapFillConfirm}
        />
      )}

      <OperatorAssignDialog open={assignOpen} onOpenChange={setAssignOpen} operators={currentShift ? operators.filter(op => !shifts.find(s => s.id === currentShift)?.operatorIds.includes(op.id)) : operators} onConfirm={onAssign} />
    </main>;
};
export default EventDetail;