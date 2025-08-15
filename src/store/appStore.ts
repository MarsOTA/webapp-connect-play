import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ID = string;

export interface Client {
  id: ID;
  name: string;
}

export interface Brand {
  id: ID;
  name: string;
}

export interface Operator {
  id: ID;
  name: string;
  role: string;
  availability: "Disponibile" | "Occupato" | "In ferie";
}

export interface EventItem {
  id: ID;
  title: string;
  clientId: ID;
  brandId: ID;
  address: string;
  activityCode?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface Task {
  id: ID;
  eventId: ID;
  title: string;
  completed: boolean;
  createdAt: string;
}

export type ActivityType =
  | "doorman"
  | "presidio notturno e diurno"
  | "presidio notturno"
  | "presido diurno"
  | "gestione flussi ingresso e uscite"
  | "shooting"
  | "endorsement"
  | "GPG armata con auto"
  | "GPG armata senza auto";

export const ACTIVITY_TYPES: ActivityType[] = [
  "doorman",
  "presidio notturno e diurno",
  "presidio notturno",
  "presido diurno",
  "gestione flussi ingresso e uscite",
  "shooting",
  "endorsement",
  "GPG armata con auto",
  "GPG armata senza auto",
];

// New data structure for timeline management
export interface TurnoRichiesta {
  id: ID;
  eventId: ID;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  operatoriRichiesti: number;
  activityType?: ActivityType;
  notes?: string;
}

export interface AssegnazioneOperatore {
  id: ID;
  turnoId: ID;
  operatoreId: ID;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isTeamLeader?: boolean;
}

// Keep old Shift interface for backward compatibility during migration
export interface Shift {
  id: ID;
  eventId: ID;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  operatorIds: ID[];
  activityType?: ActivityType;
  teamLeaderId?: ID;
  requiredOperators: number;
  notes?: string;
}

interface AppState {
  clients: Client[];
  brands: Brand[];
  operators: Operator[];
  events: EventItem[];
  shifts: Shift[];
  tasks: Task[];
  
  // New timeline-based shift management
  turniRichiesti: TurnoRichiesta[];
  assegnazioniOperatori: AssegnazioneOperatore[];

  createEvent: (data: Omit<EventItem, "id">) => EventItem;
  updateEvent: (id: ID, data: Partial<EventItem>) => void;
  getEventById: (id: ID) => EventItem | undefined;

  // Legacy shift methods (for backward compatibility)
  createShift: (data: Omit<Shift, "id" | "operatorIds"> & { operatorIds?: ID[] }) => Shift;
  assignOperators: (shiftId: ID, operatorIds: ID[]) => void;
  setOperatorSlot: (shiftId: ID, slotIndex: number, operatorId: ID) => void;
  removeOperator: (shiftId: ID, operatorId: ID) => void;
  replaceOperator: (shiftId: ID, oldOperatorId: ID, newOperatorId: ID) => void;
  setTeamLeader: (shiftId: ID, operatorId: ID) => void;
  updateShiftNotes: (shiftId: ID, notes: string) => void;
  updateShiftTime: (shiftId: ID, data: { startTime?: string; endTime?: string }) => void;
  updateShiftActivityType: (shiftId: ID, activityType: ActivityType | undefined) => void;
  deleteShift: (shiftId: ID) => void;
  getShiftsByEvent: (eventId: ID) => Shift[];
  updateEventAddress: (eventId: ID, address: string) => void;
  updateEventActivityCode: (eventId: ID, activityCode: string) => void;

  // New timeline-based methods
  createTurnoRichiesta: (data: Omit<TurnoRichiesta, "id">) => TurnoRichiesta;
  updateTurnoRichiesta: (id: ID, data: Partial<TurnoRichiesta>) => void;
  deleteTurnoRichiesta: (id: ID) => void;
  getTurniRichiestiByEvent: (eventId: ID) => TurnoRichiesta[];
  splitTurnoRichiesta: (turnoId: ID, splitTime: string) => { turno1: TurnoRichiesta; turno2: TurnoRichiesta };
  
  createAssegnazioneOperatore: (data: Omit<AssegnazioneOperatore, "id">) => AssegnazioneOperatore;
  updateAssegnazioneOperatore: (id: ID, data: Partial<AssegnazioneOperatore>) => void;
  deleteAssegnazioneOperatore: (id: ID) => void;
  getAssegnazioniByTurno: (turnoId: ID) => AssegnazioneOperatore[];
  getAssegnazioniByEvent: (eventId: ID) => AssegnazioneOperatore[];
  
  // Gap and coverage analysis
  getTimelineCoverage: (turnoId: ID) => { intervals: Array<{ start: string; end: string; coverage: number; required: number }> };
  getGaps: (turnoId: ID) => Array<{ start: string; end: string }>;
  fillGap: (turnoId: ID, gapStart: string, gapEnd: string, operatorId: ID) => AssegnazioneOperatore;

  createTask: (data: Omit<Task, "id" | "createdAt" | "completed">) => Task;
  updateTask: (id: ID, data: Partial<Pick<Task, "title" | "completed">>) => void;
  deleteTask: (id: ID) => void;
  getTasksByEvent: (eventId: ID) => Task[];
}

const uid = () => Math.random().toString(36).slice(2, 10);

const initialClients: Client[] = [
  { id: "c1", name: "Alfa Group" },
  { id: "c2", name: "Beta S.p.A." },
  { id: "c3", name: "Gamma SRL" },
];

const initialBrands: Brand[] = [
  { id: "b1", name: "BrandX" },
  { id: "b2", name: "BrandY" },
  { id: "b3", name: "BrandZ" },
];

const initialOperators: Operator[] = [
  { id: "o1", name: "Mario Rossi", role: "Guardia", availability: "Disponibile" },
  { id: "o2", name: "Luca Bianchi", role: "Supervisore", availability: "Disponibile" },
  { id: "o3", name: "Anna Verdi", role: "Guardia", availability: "Occupato" },
  { id: "o4", name: "Sara Neri", role: "Addetto Accoglienza", availability: "Disponibile" },
];

// Helper functions for timeline calculations
const getTimeIntervals = (startTime: string, endTime: string): string[] => {
  const intervals: string[] = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + 15)) {
    intervals.push(time.toTimeString().slice(0, 5));
  }
  
  return intervals;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: initialClients,
      brands: initialBrands,
      operators: initialOperators,
      events: [],
      shifts: [],
      tasks: [],
      turniRichiesti: [],
      assegnazioniOperatori: [],

      createEvent: (data) => {
        const newEvent: EventItem = { id: uid(), ...data };
        set((state) => ({ events: [newEvent, ...state.events] }));
        return newEvent;
      },

      updateEvent: (id, data) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }));
      },

      getEventById: (id) => get().events.find((e) => e.id === id),

      createShift: ({ eventId, date, startTime, endTime, operatorIds = [], activityType, teamLeaderId, requiredOperators, notes }) => {
        const newShift: Shift = { id: uid(), eventId, date, startTime, endTime, operatorIds, activityType, teamLeaderId, requiredOperators, notes };
        set((state) => ({ shifts: [newShift, ...state.shifts] }));
        return newShift;
      },

      assignOperators: (shiftId, operatorIds) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId
              ? { ...s, operatorIds: Array.from(new Set([...s.operatorIds, ...operatorIds])) }
              : s
          ),
        }));
      },

      setOperatorSlot: (shiftId, slotIndex, operatorId) => {
        set((state) => ({
          shifts: state.shifts.map((s) => {
            if (s.id !== shiftId) return s;
            const newOperatorIds = [...s.operatorIds];
            // Ensure array is large enough
            while (newOperatorIds.length <= slotIndex) {
              newOperatorIds.push("");
            }
            newOperatorIds[slotIndex] = operatorId;
            return { ...s, operatorIds: newOperatorIds };
          }),
        }));
      },

      removeOperator: (shiftId, operatorId) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId
              ? {
                  ...s,
                  operatorIds: s.operatorIds.filter((id) => id !== operatorId),
                  teamLeaderId: s.teamLeaderId === operatorId ? undefined : s.teamLeaderId,
                }
              : s
          ),
        }));
      },

      replaceOperator: (shiftId, oldOperatorId, newOperatorId) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId
              ? {
                  ...s,
                  operatorIds: s.operatorIds.map((id) => (id === oldOperatorId ? newOperatorId : id)),
                  teamLeaderId: s.teamLeaderId === oldOperatorId ? newOperatorId : s.teamLeaderId,
                }
              : s
          ),
        }));
      },

      setTeamLeader: (shiftId, operatorId) => {
        set((state) => ({
          shifts: state.shifts.map((s) => {
            if (s.id !== shiftId) return s;
            // Se operatorId è vuoto o non valido, rimuovi il Team Leader
            if (!operatorId || !s.operatorIds.includes(operatorId)) {
              return { ...s, teamLeaderId: undefined };
            }
            // Altrimenti imposta il Team Leader
            return { ...s, teamLeaderId: operatorId };
          }),
        }));
      },

      updateShiftNotes: (shiftId, notes) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId ? { ...s, notes } : s
          ),
        }));
      },

      updateShiftTime: (shiftId, data) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId ? { ...s, ...data } : s
          ),
        }));
      },

      updateShiftActivityType: (shiftId, activityType) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId ? { ...s, activityType } : s
          ),
        }));
      },

      deleteShift: (shiftId) => {
        set((state) => ({
          shifts: state.shifts.filter((s) => s.id !== shiftId),
        }));
      },

      getShiftsByEvent: (eventId) => get().shifts.filter((s) => s.eventId === eventId),

      updateEventAddress: (eventId, address) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === eventId ? { ...e, address } : e)),
        }));
      },

      updateEventActivityCode: (eventId, activityCode) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === eventId ? { ...e, activityCode } : e)),
        }));
      },

      createTask: (data) => {
        const newTask: Task = { 
          id: uid(), 
          ...data, 
          completed: false,
          createdAt: new Date().toISOString() 
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        return newTask;
      },

      updateTask: (id, data) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      getTasksByEvent: (eventId) => get().tasks.filter((t) => t.eventId === eventId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      // New timeline-based methods
      createTurnoRichiesta: (data) => {
        const newTurno: TurnoRichiesta = { id: uid(), ...data };
        set((state) => ({ turniRichiesti: [newTurno, ...state.turniRichiesti] }));
        return newTurno;
      },

      updateTurnoRichiesta: (id, data) => {
        set((state) => ({
          turniRichiesti: state.turniRichiesti.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
      },

      deleteTurnoRichiesta: (id) => {
        set((state) => ({
          turniRichiesti: state.turniRichiesti.filter((t) => t.id !== id),
          assegnazioniOperatori: state.assegnazioniOperatori.filter((a) => a.turnoId !== id),
        }));
      },

      getTurniRichiestiByEvent: (eventId) => get().turniRichiesti.filter((t) => t.eventId === eventId),

      splitTurnoRichiesta: (turnoId, splitTime) => {
        const turno = get().turniRichiesti.find((t) => t.id === turnoId);
        if (!turno) throw new Error("Turno not found");

        const turno1: TurnoRichiesta = {
          ...turno,
          id: uid(),
          endTime: splitTime,
        };

        const turno2: TurnoRichiesta = {
          ...turno,
          id: uid(),
          startTime: splitTime,
        };

        // Update assignments that span across the split
        const assignments = get().assegnazioniOperatori.filter((a) => a.turnoId === turnoId);
        const newAssignments: AssegnazioneOperatore[] = [];

        assignments.forEach((assignment) => {
          const assignmentStart = timeToMinutes(assignment.startTime);
          const assignmentEnd = timeToMinutes(assignment.endTime);
          const split = timeToMinutes(splitTime);

          if (assignmentEnd <= split) {
            // Assignment belongs to first turno
            newAssignments.push({ ...assignment, turnoId: turno1.id });
          } else if (assignmentStart >= split) {
            // Assignment belongs to second turno
            newAssignments.push({ ...assignment, turnoId: turno2.id });
          } else {
            // Assignment spans across split - create two assignments
            newAssignments.push({
              ...assignment,
              id: uid(),
              turnoId: turno1.id,
              endTime: splitTime,
            });
            newAssignments.push({
              ...assignment,
              id: uid(),
              turnoId: turno2.id,
              startTime: splitTime,
            });
          }
        });

        set((state) => ({
          turniRichiesti: [
            ...state.turniRichiesti.filter((t) => t.id !== turnoId),
            turno1,
            turno2,
          ],
          assegnazioniOperatori: [
            ...state.assegnazioniOperatori.filter((a) => a.turnoId !== turnoId),
            ...newAssignments,
          ],
        }));

        return { turno1, turno2 };
      },

      createAssegnazioneOperatore: (data) => {
        const newAssegnazione: AssegnazioneOperatore = { id: uid(), ...data };
        set((state) => ({ assegnazioniOperatori: [newAssegnazione, ...state.assegnazioniOperatori] }));
        return newAssegnazione;
      },

      updateAssegnazioneOperatore: (id, data) => {
        set((state) => ({
          assegnazioniOperatori: state.assegnazioniOperatori.map((a) => (a.id === id ? { ...a, ...data } : a)),
        }));
      },

      deleteAssegnazioneOperatore: (id) => {
        set((state) => ({
          assegnazioniOperatori: state.assegnazioniOperatori.filter((a) => a.id !== id),
        }));
      },

      getAssegnazioniByTurno: (turnoId) => get().assegnazioniOperatori.filter((a) => a.turnoId === turnoId),

      getAssegnazioniByEvent: (eventId) => {
        const turni = get().turniRichiesti.filter((t) => t.eventId === eventId);
        const turnoIds = turni.map((t) => t.id);
        return get().assegnazioniOperatori.filter((a) => turnoIds.includes(a.turnoId));
      },

      getTimelineCoverage: (turnoId) => {
        const turno = get().turniRichiesti.find((t) => t.id === turnoId);
        if (!turno) return { intervals: [] };

        const assignments = get().assegnazioniOperatori.filter((a) => a.turnoId === turnoId);
        const intervals = getTimeIntervals(turno.startTime, turno.endTime);
        
        return {
          intervals: intervals.map((intervalStart, index) => {
            const intervalEnd = intervals[index + 1] || turno.endTime;
            const intervalStartMinutes = timeToMinutes(intervalStart);
            const intervalEndMinutes = timeToMinutes(intervalEnd);
            
            const coverage = assignments.filter((assignment) => {
              const assignmentStart = timeToMinutes(assignment.startTime);
              const assignmentEnd = timeToMinutes(assignment.endTime);
              return assignmentStart <= intervalStartMinutes && assignmentEnd >= intervalEndMinutes;
            }).length;

            return {
              start: intervalStart,
              end: intervalEnd,
              coverage,
              required: turno.operatoriRichiesti,
            };
          }).filter((_, index) => index < intervals.length - 1),
        };
      },

      getGaps: (turnoId) => {
        const coverage = get().getTimelineCoverage(turnoId);
        const gaps: Array<{ start: string; end: string }> = [];
        
        let gapStart: string | null = null;
        
        coverage.intervals.forEach((interval) => {
          if (interval.coverage === 0) {
            if (gapStart === null) {
              gapStart = interval.start;
            }
          } else {
            if (gapStart !== null) {
              gaps.push({ start: gapStart, end: interval.start });
              gapStart = null;
            }
          }
        });
        
        // Handle gap at the end
        if (gapStart !== null && coverage.intervals.length > 0) {
          const lastInterval = coverage.intervals[coverage.intervals.length - 1];
          gaps.push({ start: gapStart, end: lastInterval.end });
        }
        
        return gaps;
      },

      fillGap: (turnoId, gapStart, gapEnd, operatorId) => {
        const newAssignment = get().createAssegnazioneOperatore({
          turnoId,
          operatoreId: operatorId,
          startTime: gapStart,
          endTime: gapEnd,
        });
        return newAssignment;
      },
    }),
    { name: "security-agency-store" }
  )
);
