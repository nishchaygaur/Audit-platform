/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  X,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";

type EventType =
  | "Audit"
  | "Task"
  | "Evidence"
  | "Finding"
  | "Risk"
  | "Remediation"
  | "Meeting";

type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  type: EventType;
  reference: string;
  owner: string;
};

const workspaceEvents: Record<string, CalendarEvent[]> = {
  "abc-technologies": [
    {
      id: "EVT-001",
      title: "ISO 27001 Audit Kickoff",
      description: "Kickoff meeting for the annual ISO 27001 audit.",
      date: "2024-07-01",
      startTime: "09:00",
      endTime: "10:00",
      type: "Audit",
      reference: "AUD-2024-001",
      owner: "Alice Smith",
    },
    {
      id: "EVT-002",
      title: "Access Control Review",
      description: "Review privileged access controls.",
      date: "2024-07-02",
      startTime: "11:00",
      endTime: "12:00",
      type: "Task",
      reference: "TSK-001",
      owner: "John Carter",
    },
    {
      id: "EVT-003",
      title: "Evidence Submission Deadline",
      description: "Deadline for submitting access review evidence.",
      date: "2024-07-03",
      startTime: "15:00",
      endTime: "16:00",
      type: "Evidence",
      reference: "AUD-2024-001",
      owner: "Emily Davis",
    },
    {
      id: "EVT-004",
      title: "Finding Review",
      description: "Review open audit findings with the audit team.",
      date: "2024-07-05",
      startTime: "10:00",
      endTime: "11:00",
      type: "Finding",
      reference: "FND-001",
      owner: "Alice Smith",
    },
    {
      id: "EVT-005",
      title: "Risk Assessment Meeting",
      description: "Review high and critical audit risks.",
      date: "2024-07-08",
      startTime: "14:00",
      endTime: "15:00",
      type: "Risk",
      reference: "RSK-001",
      owner: "Michael Lee",
    },
    {
      id: "EVT-006",
      title: "Remediation Follow-up",
      description: "Follow up on outstanding remediation actions.",
      date: "2024-07-10",
      startTime: "13:00",
      endTime: "14:00",
      type: "Remediation",
      reference: "REM-002",
      owner: "David Wilson",
    },
  ],

  "xyz-finance": [
    {
      id: "EVT-101",
      title: "Financial Controls Audit",
      description: "Annual financial controls audit kickoff.",
      date: "2024-07-01",
      startTime: "09:00",
      endTime: "10:00",
      type: "Audit",
      reference: "AUD-2024-101",
      owner: "Robert Wilson",
    },
    {
      id: "EVT-102",
      title: "MFA Evidence Review",
      description: "Review MFA implementation evidence.",
      date: "2024-07-03",
      startTime: "11:00",
      endTime: "12:00",
      type: "Evidence",
      reference: "AUD-2024-101",
      owner: "Emma Davis",
    },
    {
      id: "EVT-103",
      title: "Vendor Risk Meeting",
      description: "Review outstanding vendor risks.",
      date: "2024-07-05",
      startTime: "14:00",
      endTime: "15:00",
      type: "Risk",
      reference: "RSK-101",
      owner: "James Miller",
    },
    {
      id: "EVT-104",
      title: "Remediation Review",
      description: "Review vendor management remediation.",
      date: "2024-07-08",
      startTime: "10:00",
      endTime: "11:00",
      type: "Remediation",
      reference: "REM-101",
      owner: "Olivia Taylor",
    },
    {
      id: "EVT-105",
      title: "Audit Status Meeting",
      description: "Weekly audit status meeting.",
      date: "2024-07-10",
      startTime: "15:00",
      endTime: "16:00",
      type: "Meeting",
      reference: "AUD-2024-101",
      owner: "Robert Wilson",
    },
  ],

  "pqr-healthcare": [
    {
      id: "EVT-201",
      title: "Healthcare Security Audit",
      description: "Security audit kickoff.",
      date: "2024-07-01",
      startTime: "09:00",
      endTime: "10:00",
      type: "Audit",
      reference: "AUD-2024-201",
      owner: "Daniel Smith",
    },
    {
      id: "EVT-202",
      title: "Patient Data Access Review",
      description: "Review access to sensitive patient information.",
      date: "2024-07-02",
      startTime: "10:00",
      endTime: "11:00",
      type: "Task",
      reference: "TSK-201",
      owner: "Daniel Smith",
    },
    {
      id: "EVT-203",
      title: "Encryption Evidence Review",
      description: "Review encryption control evidence.",
      date: "2024-07-04",
      startTime: "13:00",
      endTime: "14:00",
      type: "Evidence",
      reference: "AUD-2024-201",
      owner: "Sophia Johnson",
    },
    {
      id: "EVT-204",
      title: "Incident Response Review",
      description: "Review incident response controls.",
      date: "2024-07-08",
      startTime: "11:00",
      endTime: "12:00",
      type: "Finding",
      reference: "FND-201",
      owner: "William Brown",
    },
    {
      id: "EVT-205",
      title: "Remediation Follow-up",
      description: "Follow up on backup remediation.",
      date: "2024-07-10",
      startTime: "14:00",
      endTime: "15:00",
      type: "Remediation",
      reference: "REM-201",
      owner: "William Brown",
    },
  ],
};

const typeClasses: Record<EventType, string> = {
  Audit: "bg-blue-100 text-blue-700",
  Task: "bg-purple-100 text-purple-700",
  Evidence: "bg-cyan-100 text-cyan-700",
  Finding: "bg-red-100 text-red-700",
  Risk: "bg-orange-100 text-orange-700",
  Remediation: "bg-green-100 text-green-700",
  Meeting: "bg-slate-100 text-slate-700",
};

const emptyEvent: Omit<CalendarEvent, "id"> = {
  title: "",
  description: "",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  type: "Meeting",
  reference: "",
  owner: "",
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CalendarPage() {
  const { currentWorkspace } = useWorkspace();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(2024, 6, 1)
  );

  const [selectedDate, setSelectedDate] = useState(
    new Date(2024, 6, 1)
  );

  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null);

  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [editingEvent, setEditingEvent] =
    useState<CalendarEvent | null>(null);

  const [form, setForm] = useState(emptyEvent);
  const inputClass =
  "w-full h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] text-slate-700 outline-none bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  useEffect(() => {
     // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvents(
      JSON.parse(
        JSON.stringify(workspaceEvents[currentWorkspace.id] ?? [])
      )
    );
  }, [currentWorkspace.id]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }

    while (days.length < 42) {
      days.push(null);
    }

    return days;
  }, [currentMonth]);

  const selectedDateEvents = events
    .filter((event) => event.date === dateKey(selectedDate))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingEvents = [...events]
    .sort((a, b) =>
      `${a.date} ${a.startTime}`.localeCompare(
        `${b.date} ${b.startTime}`
      )
    )
    .slice(0, 5);

  function previousMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  }

  function goToday() {
    const today = new Date();

    setCurrentMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    setSelectedDate(today);
  }

  function openCreateModal(date?: Date) {
    const targetDate = date ?? selectedDate;

    setEditingEvent(null);

    setForm({
      ...emptyEvent,
      date: dateKey(targetDate),
    });

    setShowModal(true);
  }

  function openEditModal(event: CalendarEvent) {
    setEditingEvent(event);

    setForm({
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      type: event.type,
      reference: event.reference,
      owner: event.owner,
    });

    setShowModal(true);
  }

  function saveEvent() {
    if (
      !form.title.trim() ||
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      !form.owner.trim()
    ) {
      alert("Please enter a title, date, time and owner.");
      return;
    }

    if (editingEvent) {
       // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvents((current) =>
        current.map((event) =>
          event.id === editingEvent.id
            ? {
                ...event,
                ...form,
                title: form.title.trim(),
                owner: form.owner.trim(),
              }
            : event
        )
      );
    } else {
      const nextNumber =
        events.reduce((max, event) => {
          const number = Number(event.id.replace(/\D/g, ""));

          return Number.isFinite(number)
            ? Math.max(max, number)
            : max;
        }, 0) + 1;

      const newEvent: CalendarEvent = {
        id: `EVT-${String(nextNumber).padStart(3, "0")}`,
        ...form,
        title: form.title.trim(),
        owner: form.owner.trim(),
      };

       // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvents((current) => [...current, newEvent]);
    }

    setShowModal(false);
    setEditingEvent(null);
    setForm(emptyEvent);
  }

  function deleteEvent(id: string) {
    if (!confirm("Delete this calendar event?")) return;

     // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvents((current) =>
      current.filter((event) => event.id !== id)
    );

    if (selectedEvent?.id === id) {
      setSelectedEvent(null);
      setShowDetails(false);
    }
  }

  function viewEvent(event: CalendarEvent) {
    setSelectedEvent(event);
    setShowDetails(true);
  }

  return (
    <main className="ml-[250px] min-h-screen bg-[#f6f8fc]">
      <div className="px-8 py-7">
        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-[25px] font-semibold text-slate-900">
              Calendar
            </h1>

            <p className="mt-1 text-[13px] text-slate-500">
              Schedule and manage audit activities
            </p>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#1d4ed8]"
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>

        {/* Workspace */}
        <div className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Current Workspace
          </p>

          <p className="mt-0.5 text-[14px] font-semibold text-slate-800">
            {currentWorkspace.name}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_290px] gap-5">
          {/* Calendar */}
          <div className="rounded-xl border border-slate-200 bg-white">
            {/* Calendar Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <CalendarDays
                  size={19}
                  className="text-blue-600"
                />

                <h2 className="text-[15px] font-semibold text-slate-800">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={goToday}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Today
                </button>

                <button
                  onClick={previousMonth}
                  className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                >
                  <ChevronLeft size={15} />
                </button>

                <button
                  onClick={nextMonth}
                  className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[105px] border-b border-r border-slate-100 bg-slate-50/40"
                    />
                  );
                }

                const key = dateKey(day);

                const dayEvents = events
                  .filter((event) => event.date === key)
                  .slice(0, 3);

                const isSelected =
                  dateKey(selectedDate) === key;

                const isToday =
                  dateKey(new Date()) === key;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[105px] border-b border-r border-slate-100 p-2 text-left align-top transition hover:bg-blue-50/40 ${
                      isSelected
                        ? "bg-blue-50/60"
                        : "bg-white"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                          isToday
                            ? "bg-blue-600 text-white"
                            : isSelected
                              ? "bg-blue-100 text-blue-700"
                              : "text-slate-600"
                        }`}
                      >
                        {day.getDate()}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[9px] text-slate-400">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            viewEvent(event);
                          }}
                          className={`truncate rounded px-1.5 py-1 text-[9px] font-medium ${typeClasses[event.type]}`}
                        >
                          {event.startTime} {event.title}
                        </div>
                      ))}

                      {events.filter(
                        (event) => event.date === key
                      ).length > 3 && (
                        <p className="px-1 text-[9px] text-slate-400">
                          +
                          {events.filter(
                            (event) => event.date === key
                          ).length - 3}{" "}
                          more
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-5">
            {/* Selected Date */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Selected Date
                </p>

                <p className="mt-1 text-[14px] font-semibold text-slate-800">
                  {formatLongDate(selectedDate)}
                </p>
              </div>

              <div className="p-4">
                {selectedDateEvents.length === 0 ? (
                  <div className="py-8 text-center">
                    <CalendarDays
                      size={25}
                      className="mx-auto mb-2 text-slate-300"
                    />

                    <p className="text-[11px] font-medium text-slate-500">
                      No events scheduled
                    </p>

                    <button
                      onClick={() => openCreateModal()}
                      className="mt-3 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                    >
                      + Add event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`rounded-full px-2 py-1 text-[9px] font-medium ${typeClasses[event.type]}`}
                            >
                              {event.type}
                            </span>

                            <p className="mt-2 text-[11px] font-semibold text-slate-800">
                              {event.title}
                            </p>
                          </div>

                          <button
                            onClick={() => viewEvent(event)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100"
                          >
                            <Eye size={13} />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock3 size={12} />
                          {event.startTime} - {event.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-4">
                <p className="text-[13px] font-semibold text-slate-800">
                  Upcoming Events
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {upcomingEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => viewEvent(event)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <p className="truncate text-[11px] font-medium text-slate-700">
                      {event.title}
                    </p>

                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400">
                        {formatShortDate(event.date)}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[8px] font-medium ${typeClasses[event.type]}`}
                      >
                        {event.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {showDetails && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-[10px] font-medium text-blue-600">
                  {selectedEvent.id}
                </p>

                <h2 className="mt-1 text-[17px] font-semibold text-slate-900">
                  {selectedEvent.title}
                </h2>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="text-[12px] leading-5 text-slate-600">
                  {selectedEvent.description ||
                    "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <DetailItem
                  label="Date"
                  value={formatShortDate(selectedEvent.date)}
                />

                <DetailItem
                  label="Time"
                  value={`${selectedEvent.startTime} - ${selectedEvent.endTime}`}
                />

                <DetailItem
                  label="Type"
                  value={selectedEvent.type}
                />

                <DetailItem
                  label="Reference"
                  value={selectedEvent.reference || "—"}
                />

                <DetailItem
                  label="Owner"
                  value={selectedEvent.owner}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowDetails(false);
                  openEditModal(selectedEvent);
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                onClick={() => deleteEvent(selectedEvent.id)}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-red-700"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-[16px] font-semibold text-slate-900">
                  {editingEvent ? "Edit Event" : "Add Event"}
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Schedule an audit activity
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-5">
              <FormField label="Event Title">
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter event title"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Owner">
                <input
                  value={form.owner}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      owner: e.target.value,
                    })
                  }
                  placeholder="Enter owner"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Date">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      date: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Type">
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as EventType,
                    })
                  }
                  className={inputClass}
                >
                  <option>Audit</option>
                  <option>Task</option>
                  <option>Evidence</option>
                  <option>Finding</option>
                  <option>Risk</option>
                  <option>Remediation</option>
                  <option>Meeting</option>
                </select>
              </FormField>

              <FormField label="Start Time">
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      startTime: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="End Time">
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      endTime: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Reference">
                <input
                  value={form.reference}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reference: e.target.value,
                    })
                  }
                  placeholder="AUD-2024-001"
                  className={inputClass}
                />
              </FormField>

              <div />

              <FormField label="Description" full>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the event..."
                  className={`${inputClass} h-auto resize-none py-2`}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={saveEvent}
                className="rounded-lg bg-blue-600 px-5 py-2 text-[12px] font-medium text-white hover:bg-blue-700"
              >
                {editingEvent ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function FormField({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1.5 block text-[11px] font-medium text-slate-600">
        {label}
      </label>

      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="text-[12px] font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}