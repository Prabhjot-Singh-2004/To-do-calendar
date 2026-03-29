import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addWeeks,
  addMonths,
  addYears,
  subWeeks,
  subMonths,
  subYears,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getMonth,
} from "date-fns";
import { fetchTasks, createTask, updateTask, deleteTask } from "./api";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CATEGORIES = [
  { name: "General", color: "bg-gray-400" },
  { name: "Math", color: "bg-blue-500" },
  { name: "Computer Science", color: "bg-green-500" },
  { name: "Physics", color: "bg-purple-500" },
  { name: "Language", color: "bg-yellow-500" },
  { name: "Reading", color: "bg-orange-500" },
  { name: "Review", color: "bg-pink-500" },
  { name: "Practice", color: "bg-cyan-500" },
];

function getCategoryColor(name) {
  const cat = CATEGORIES.find((c) => c.name === name);
  return cat ? cat.color : "bg-gray-400";
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
      type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
    }`}>
      {message}
    </div>
  );
}

function TaskItem({ task, onToggle, onEdit, onDelete, timerState, onTimerToggle, onTimerReset }) {
  const [hovered, setHovered] = useState(false);
  const isActive = timerState?.active || false;
  const elapsed = timerState?.elapsed || 0;

  return (
    <div
      className="flex items-start gap-3 py-2 px-2 rounded group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
        className="w-5 h-5 accent-blue-500 cursor-pointer flex-shrink-0 mt-1"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getCategoryColor(task.category)}`} />
          <span className={`text-base truncate ${
            task.completed ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-200"
          }`}>
            {task.title}
          </span>
        </div>
        {task.notes && (
          <p className={`text-sm mt-1 truncate italic ${
            task.completed ? "text-gray-300 dark:text-gray-700" : "text-gray-400 dark:text-gray-500"
          }`}>
            {task.notes}
          </p>
        )}
        {task.duration > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 inline-block">
            {task.duration}h planned
          </span>
        )}
      </div>

      {/* Timer */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {elapsed > 0 && (
          <span className={`text-[10px] sm:text-xs font-mono ${isActive ? "text-green-500" : "text-gray-400 dark:text-gray-500"}`}>
            {formatTime(elapsed)}
          </span>
        )}
        <button
          onClick={() => onTimerToggle(task._id)}
          className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium transition ${
            isActive
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
          }`}
          title={isActive ? "Pause" : "Start"}
        >
          {isActive ? "Pause" : "Start"}
        </button>
        {elapsed > 0 && (
          <button
            onClick={() => onTimerReset(task._id)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            title="Reset timer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Edit/Delete */}
      {hovered && (
        <div className="absolute right-1 top-1 flex gap-1 bg-white dark:bg-gray-700 shadow-sm rounded px-1">
          <button
            onClick={() => onEdit(task)}
            className="text-gray-400 hover:text-blue-500 p-0.5"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task)}
            className="text-gray-400 hover:text-red-500 p-0.5"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function AddTaskInput({ date, onAdd }) {
  const [value, setValue] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("General");
  const [duration, setDuration] = useState(1);

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd(value.trim(), date, category, notes.trim(), duration);
      setValue("");
      setNotes("");
      setCategory("General");
      setDuration(1);
      setExpanded(false);
    }
  };

  return (
    <div className="mt-1">
      {!expanded ? (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          onFocus={() => setExpanded(true)}
          placeholder="+ Add task..."
          className="w-full text-sm py-1 px-1 border-none outline-none bg-transparent text-gray-500 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600"
        />
      ) : (
        <div className="space-y-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") { setExpanded(false); setValue(""); setNotes(""); }
            }}
            placeholder="Task title..."
            className="w-full text-sm py-1.5 px-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-400"
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 text-sm py-1.5 px-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Hours:</label>
              <input
                type="number"
                min="0.5"
                max="8"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                className="w-16 text-sm py-1.5 px-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none text-center"
              />
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)..."
            rows={2}
            className="w-full text-sm py-1.5 px-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 outline-none resize-none"
          />
          <div className="flex gap-1">
            <button onClick={handleSubmit} className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Add</button>
            <button onClick={() => { setExpanded(false); setValue(""); setNotes(""); }} className="text-sm px-3 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditModal({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || "");
  const [category, setCategory] = useState(task.category || "General");
  const [duration, setDuration] = useState(task.duration || 1);

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-5 w-[90vw] sm:w-96" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-3 text-gray-700 dark:text-gray-200">Edit Task</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) {
              onSave(task._id, { title: title.trim(), notes, category, duration });
            }
          }}
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-base bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoFocus
        />
        <div className="flex gap-2 mt-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Hrs:</label>
            <input
              type="number"
              min="0.5"
              max="8"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
              className="w-16 border border-gray-300 dark:border-gray-600 rounded px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none text-center"
            />
          </div>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes..."
          rows={3}
          className="w-full mt-2 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Cancel</button>
          <button
            onClick={() => title.trim() && onSave(task._id, { title: title.trim(), notes, category, duration })}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function WeekView({ currentDate, tasks, onAdd, onToggle, onEdit, onDelete, timerStates, onTimerToggle, onTimerReset }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayTasks = tasks.filter((t) => t.date === dateStr);
          return (
            <div key={dateStr} className={`rounded-lg border flex flex-col ${
              isToday(day)
                ? "border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-900 shadow-md"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            }`}>
              <div className={`px-3 py-2 rounded-t-lg text-center ${
                isToday(day) ? "bg-blue-600 text-white" : "bg-gray-50 dark:bg-gray-800"
              }`}>
                <span className={`text-sm font-medium ${isToday(day) ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                  {format(day, "EEEE")}
                </span>
                <span className={`text-lg font-bold ml-2 ${isToday(day) ? "text-white" : "text-gray-700 dark:text-gray-200"}`}>
                  {format(day, "d")}
                </span>
              </div>
              <div className="flex-1 p-2 overflow-y-auto max-h-[400px]">
                {dayTasks.length === 0 && (
                  <p className="text-xs text-gray-300 dark:text-gray-600 text-center py-2">No tasks</p>
                )}
                {dayTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    timerState={timerStates[task._id]}
                    onTimerToggle={onTimerToggle}
                    onTimerReset={onTimerReset}
                  />
                ))}
                <AddTaskInput date={dateStr} onAdd={onAdd} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ currentDate, tasks, onAdd, onToggle, onEdit, onDelete, onDayClick, timerStates, onTimerToggle, onTimerReset }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="flex-1 flex flex-col">
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="bg-gray-50 dark:bg-gray-800 text-center py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 flex-1 rounded-b-lg overflow-hidden">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayTasks = tasks.filter((t) => t.date === dateStr);
          const inMonth = isSameMonth(day, currentDate);
          return (
            <div
              key={dateStr}
              className={`bg-white dark:bg-gray-900 flex flex-col min-h-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                !inMonth ? "opacity-40" : ""
              }`}
              onClick={() => onDayClick(day)}
            >
              <div className={`text-right px-2 py-1 text-sm font-medium ${
                isToday(day)
                  ? "bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center ml-auto mt-1 mr-1"
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                {format(day, "d")}
              </div>
              <div className="flex-1 px-1 overflow-y-auto">
                {dayTasks.slice(0, 3).map((task) => (
                  <div key={task._id} className="flex items-center gap-1.5 py-0.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getCategoryColor(task.category)}`} />
                    <span className={`text-sm truncate ${
                      task.completed ? "line-through text-gray-300 dark:text-gray-600" : "text-gray-600 dark:text-gray-300"
                    }`}>{task.title}</span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-sm text-gray-400 dark:text-gray-500 px-1">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearView({ currentDate, onMonthClick }) {
  const yearStart = startOfYear(currentDate);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 flex-1 overflow-y-auto">
      {Array.from({ length: 12 }, (_, i) => {
        const monthDate = addMonths(yearStart, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: calStart, end: calEnd });

        return (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition"
            onClick={() => onMonthClick(monthDate)}
          >
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{MONTHS[i]}</div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, j) => (
                <div key={j} className="text-[10px] text-gray-400 dark:text-gray-500">{d}</div>
              ))}
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`text-[11px] py-0.5 rounded-full ${
                    !isSameMonth(day, monthDate)
                      ? "text-gray-200 dark:text-gray-700"
                      : isToday(day)
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {format(day, "d")}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function generateStudyPlan(tasks, allTasks, storedStartTime = null) {
  const now = new Date();
  let currentMinutes = now.getHours() * 60 + now.getMinutes();

  let studyDayDate;
  const isOvernight = currentMinutes < 180;
  const isAfternoon = currentMinutes >= 14 * 60;
  const isInStudyWindow = isOvernight || isAfternoon;

  if (isOvernight) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    studyDayDate = format(yesterday, "yyyy-MM-dd");
  } else {
    studyDayDate = format(now, "yyyy-MM-dd");
  }

  const studyDayTasks = allTasks.filter((t) => !t.completed && t.duration > 0 && t.date === studyDayDate);
  const carryoverTasks = allTasks.filter((t) => !t.completed && t.duration > 0 && t.date < studyDayDate);

  if (studyDayTasks.length === 0 && carryoverTasks.length === 0) return null;

  const MAX_STUDY_HOURS = 8;
  const blocks = [];

  const MEALS = [
    { name: "Lunch", start: 16 * 60, end: 17 * 60 },
    { name: "Dinner", start: 20 * 60 + 30, end: 21 * 60 + 30 },
  ];

  const splitIntoWindows = (tasks, isCarryover) => {
    const windows = [];
    let total = 0;
    for (const task of tasks) {
      let remaining = task.duration;
      while (remaining > 0 && total < MAX_STUDY_HOURS) {
        const size = remaining > 2.5 ? 2 : Math.min(remaining, MAX_STUDY_HOURS - total);
        if (size <= 0) break;
        windows.push({
          title: task.title, category: task.category, duration: size,
          taskId: task._id, isCarryover, date: task.date,
        });
        total += size;
        remaining -= size;
      }
    }
    return { windows, total };
  };

  const carryover = splitIntoWindows(carryoverTasks, true);
  const studyDay = splitIntoWindows(studyDayTasks, false);

  const isActive = (startMin, endMin) => {
    if (!isInStudyWindow) return false;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const norm = (m) => m >= 1440 ? m - 1440 : m;
    const s = norm(startMin), e = norm(endMin);
    if (e > s) return nowMin >= s && nowMin < e;
    return nowMin >= s || nowMin < e;
  };

  let totalStudy = 0;

  const fillSlot = (slotStart, slotEnd, windows, startIndex, breakDuration) => {
    let slotTime = slotStart;
    let idx = startIndex;
    const added = [];

    while (idx < windows.length && slotTime < slotEnd) {
      const win = windows[idx];
      const blockEnd = slotTime + win.duration * 60;
      if (blockEnd > slotEnd) break;

      added.push({
        type: "study", title: win.title, category: win.category,
        duration: win.duration,
        startDisplay: formatTimeDisplay(slotTime),
        endDisplay: formatTimeDisplay(blockEnd),
        taskId: win.taskId,
        isNow: isActive(slotTime, blockEnd),
        isCarryover: win.isCarryover, taskDate: win.date,
      });
      totalStudy += win.duration;
      slotTime = blockEnd;
      idx++;

      if (idx < windows.length && slotTime + breakDuration <= slotEnd) {
        added.push({
          type: "break",
          title: breakDuration >= 20 ? "Short Break" : "Micro Break",
          duration: breakDuration / 60,
          startDisplay: formatTimeDisplay(slotTime),
          endDisplay: formatTimeDisplay(slotTime + breakDuration),
          isNow: isActive(slotTime, slotTime + breakDuration),
        });
        slotTime += breakDuration;
      }
    }
    return { added, nextTime: slotTime, nextIndex: idx };
  };

  if (isOvernight) {
    const allWindows = [...studyDay.windows, ...carryover.windows];
    if (allWindows.length > 0) {
      const start = storedStartTime !== null ? storedStartTime : Math.ceil(currentMinutes / 5) * 5;
      const result = fillSlot(start, 3 * 60, allWindows, 0, 10);
      blocks.push(...result.added);
    }
  }

  if (!isOvernight) {
    const allWindows = [...studyDay.windows];
    let taskIndex = 0;

    if (taskIndex < allWindows.length) {
      const r = fillSlot(14 * 60, 16 * 60, allWindows, taskIndex, 15);
      blocks.push(...r.added);
      taskIndex = r.nextIndex;
    }

    blocks.push({
      type: "meal", title: "Lunch", duration: 1,
      startDisplay: "4:00 PM", endDisplay: "5:00 PM",
      isNow: isActive(16 * 60, 17 * 60),
    });

    if (taskIndex < allWindows.length) {
      const r = fillSlot(17 * 60, 20 * 60 + 30, allWindows, taskIndex, 15);
      blocks.push(...r.added);
      taskIndex = r.nextIndex;
    }

    blocks.push({
      type: "meal", title: "Dinner", duration: 1,
      startDisplay: "8:30 PM", endDisplay: "9:30 PM",
      isNow: isActive(20 * 60 + 30, 21 * 60 + 30),
    });

    if (taskIndex < allWindows.length) {
      const r = fillSlot(21 * 60 + 30, 27 * 60, allWindows, taskIndex, 15);
      blocks.push(...r.added);
      taskIndex = r.nextIndex;
    }
  }

  if (blocks.length === 0) return null;

  const lastBlock = blocks[blocks.length - 1];

  return {
    blocks,
    totalStudyHours: totalStudy,
    endTime: lastBlock.endDisplay,
    startTime: isOvernight && storedStartTime !== null 
      ? formatTimeDisplay(storedStartTime) 
      : isOvernight 
        ? formatTimeDisplay(Math.ceil(currentMinutes / 5) * 5)
        : "2:00 PM",
    isLive: isInStudyWindow,
    isOvernight,
    studyDayDate,
    hasCarryover: carryover.windows.length > 0,
  };
}

function formatTimeDisplay(totalMinutes) {
  // Handle overnight (past midnight)
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${String(mins).padStart(2, "0")} ${period}`;
}

function StudyPlan({ tasks, allTasks }) {
  const [expanded, setExpanded] = useState(false);
  const planStartTimeRef = useRef(null);
  
  // Get current time info
  const now = new Date();
  let currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isOvernight = currentMinutes < 180;
  const isAfternoon = currentMinutes >= 14 * 60;
  
  // Store the plan start time once when entering overnight session
  if (isOvernight && planStartTimeRef.current === null) {
    planStartTimeRef.current = Math.ceil(currentMinutes / 5) * 5;
  }
  // Reset when not in overnight
  if (!isOvernight) {
    planStartTimeRef.current = null;
  }
  
  const plan = generateStudyPlan(tasks, allTasks, planStartTimeRef.current);

  if (!plan) return null;

  return (
    <div className="mx-2 sm:mx-4 mb-2 sm:mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${plan.isLive ? "bg-green-500" : "bg-blue-500"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
              {plan.isOvernight ? "Overnight Session" : plan.isLive ? `Study Plan - ${plan.studyDayDate}` : `Upcoming - ${plan.studyDayDate}`}
              {plan.isLive && (
                <span className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  LIVE
                </span>
              )}
              {plan.hasCarryover && (
                <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                  Carryover
                </span>
              )}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {plan.isOvernight ? `${plan.startTime} - 3:00 AM` : "2:00 PM - 3:00 AM"} | {plan.totalStudyHours}h study + meals & breaks
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {plan.blocks.filter((b) => b.type === "study").slice(0, 4).map((b, i) => (
              <span key={i} className={`w-2 h-6 rounded-sm ${getCategoryColor(b.category)}`} title={b.title} />
            ))}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-blue-500 transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1.5 sm:space-y-2">
            {plan.blocks.map((block, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${
                  block.isNow
                    ? "bg-green-50 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600"
                    : block.type === "meal"
                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700"
                    : block.type === "break"
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  block.type === "meal" ? "bg-amber-100 dark:bg-amber-800" :
                  block.type === "break" ? "bg-green-100 dark:bg-green-800" : 
                  getCategoryColor(block.category)
                }`}>
                  {block.type === "meal" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600 dark:text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.704 3.704 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132zM9 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm3 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : block.type === "break" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 7.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM6.41 13.42a1 1 0 011.42 0 2.5 2.5 0 004.34 0 1 1 0 011.42 1.42 4.5 4.5 0 01-7.18 0 1 1 0 010-1.42z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium flex items-center gap-2 ${
                    block.type === "meal" ? "text-amber-700 dark:text-amber-300" :
                    block.type === "break" ? "text-green-700 dark:text-green-300" : 
                    "text-gray-800 dark:text-gray-200"
                  }`}>
                    {block.title}
                    {block.isNow && (
                      <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded animate-pulse">NOW</span>
                    )}
                    {block.isCarryover && (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
                        carryover
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {block.startDisplay} - {block.endDisplay} | {block.type === "meal" ? "60 min" : block.type === "break" ? `${Math.round(block.duration * 60)} min` : `${block.duration}h`}
                  </div>
                </div>
                {block.type === "study" && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(block.category)} text-white`}>
                    {block.category}
                  </span>
                )}
                {block.type === "meal" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300">
                    Meal
                  </span>
                )}
                {block.type === "break" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300">
                    Rest
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-blue-200 dark:border-blue-800 flex flex-wrap justify-between text-xs text-blue-600 dark:text-blue-400 gap-1">
            <span>Study: {plan.totalStudyHours}h | Breaks: {(13 - 2 - plan.totalStudyHours).toFixed(1)}h</span>
            <span>Window: 2 PM - 3 AM (13h)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [timerStates, setTimerStates] = useState({});
  const intervalsRef = useRef({});

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // Timer logic
  const handleTimerToggle = useCallback((taskId) => {
    setTimerStates((prev) => {
      const current = prev[taskId] || { active: false, elapsed: 0 };
      if (current.active) {
        // Pause
        if (intervalsRef.current[taskId]) {
          clearInterval(intervalsRef.current[taskId]);
          delete intervalsRef.current[taskId];
        }
        return { ...prev, [taskId]: { ...current, active: false } };
      } else {
        // Start
        intervalsRef.current[taskId] = setInterval(() => {
          setTimerStates((p) => {
            const t = p[taskId] || { active: true, elapsed: 0 };
            if (!t.active) return p;
            return { ...p, [taskId]: { ...t, elapsed: t.elapsed + 1 } };
          });
        }, 1000);
        return { ...prev, [taskId]: { ...current, active: true } };
      }
    });
  }, []);

  const handleTimerReset = useCallback((taskId) => {
    if (intervalsRef.current[taskId]) {
      clearInterval(intervalsRef.current[taskId]);
      delete intervalsRef.current[taskId];
    }
    setTimerStates((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
    };
  }, []);

  const dateRange = useCallback(() => {
    let start, end;
    if (view === "week") {
      start = format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
      end = format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
    } else if (view === "month") {
      const ms = startOfMonth(currentDate);
      const me = endOfMonth(currentDate);
      start = format(startOfWeek(ms, { weekStartsOn: 1 }), "yyyy-MM-dd");
      end = format(endOfWeek(me, { weekStartsOn: 1 }), "yyyy-MM-dd");
    } else {
      start = format(startOfYear(currentDate), "yyyy-MM-dd");
      end = format(endOfYear(currentDate), "yyyy-MM-dd");
    }
    return { start, end };
  }, [currentDate, view]);

  const loadTasks = useCallback(async () => {
    try {
      const { start, end } = dateRange();
      const data = await fetchTasks(start, end);
      setTasks(data);
    } catch (err) {
      showToast("Failed to load tasks", "error");
    }
  }, [dateRange, showToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAdd = async (title, date, category = "General", notes = "", duration = 1) => {
    const tempId = "temp-" + Date.now();
    const tempTask = { _id: tempId, title, date, category, notes, duration, completed: false };
    setTasks((prev) => [...prev, tempTask]);
    try {
      const task = await createTask(title, date, category, notes, duration);
      setTasks((prev) => prev.map((t) => (t._id === tempId ? task : t)));
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t._id !== tempId));
      showToast("Failed to add task. Is the server running?", "error");
    }
  };

  const handleToggle = async (task) => {
    const newCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, completed: newCompleted } : t)));
    try {
      await updateTask(task._id, { completed: newCompleted });
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, completed: !newCompleted } : t)));
      showToast("Failed to update task", "error");
    }
  };

  const handleEditSave = async (id, data) => {
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, ...data } : t)));
    setEditingTask(null);
    try {
      const updated = await updateTask(id, data);
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } catch (err) {
      showToast("Failed to save changes", "error");
    }
  };

  const handleDelete = async (task) => {
    handleTimerReset(task._id);
    setTasks((prev) => prev.filter((t) => t._id !== task._id));
    try {
      await deleteTask(task._id);
    } catch (err) {
      setTasks((prev) => [...prev, task]);
      showToast("Failed to delete task", "error");
    }
  };

  const navigate = (dir) => {
    if (view === "week") {
      setCurrentDate((d) => (dir === "next" ? addWeeks(d, 1) : subWeeks(d, 1)));
    } else if (view === "month") {
      setCurrentDate((d) => (dir === "next" ? addMonths(d, 1) : subMonths(d, 1)));
    } else {
      setCurrentDate((d) => (dir === "next" ? addYears(d, 1) : subYears(d, 1)));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (day) => {
    setCurrentDate(day);
    setView("week");
  };

  const handleMonthClick = (monthDate) => {
    setCurrentDate(monthDate);
    setView("month");
  };

  const getTitle = () => {
    if (view === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (getMonth(ws) === getMonth(we)) {
        return format(ws, "MMMM yyyy");
      }
      return `${format(ws, "MMM d")} - ${format(we, "MMM d, yyyy")}`;
    } else if (view === "month") {
      return format(currentDate, "MMMM yyyy");
    }
    return format(currentDate, "yyyy");
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === "completed" && !t.completed) return false;
    if (filterStatus === "pending" && t.completed) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q));
    }
    return true;
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekTasks = tasks.filter((t) => t.date >= format(weekStart, "yyyy-MM-dd") && t.date <= format(weekEnd, "yyyy-MM-dd"));
  const completedCount = weekTasks.filter((t) => t.completed).length;
  const totalCount = weekTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Row 1: Title + Nav + Theme */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-lg font-bold text-gray-800 dark:text-gray-100">StudyTracker</h1>
            <div className="flex items-center">
              <button onClick={() => navigate("prev")} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 min-w-[80px] sm:min-w-[180px] text-center truncate px-1">{getTitle()}</span>
              <button onClick={() => navigate("next")} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <button onClick={goToToday} className="px-2 py-0.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
              Today
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Row 2: View toggles + Search + Filters */}
        <div className="flex items-center gap-2 px-3 sm:px-6 pb-2 overflow-x-auto">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex-shrink-0">
            {["week", "month", "year"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  view === v ? "bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <div className="relative flex-1 sm:w-40">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-6 pr-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-400 w-full"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 outline-none flex-shrink-0"
            >
              <option value="all">Status</option>
              <option value="completed">Done</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 outline-none flex-shrink-0"
            >
              <option value="all">Cat</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name.split(" ")[0]}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Progress bar */}
        {view === "week" && totalCount > 0 && (
          <div className="px-3 sm:px-6 pb-2 flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{completedCount}/{totalCount}</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{progressPercent}%</span>
          </div>
        )}
      </header>

      {/* Body */}
      <main className="flex-1 p-2 sm:p-4 overflow-hidden flex flex-col">
        {/* Study Plan */}
        <StudyPlan tasks={tasks.filter((t) => t.date === format(new Date(), "yyyy-MM-dd"))} allTasks={tasks} />

        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            tasks={filteredTasks}
            onAdd={handleAdd}
            onToggle={handleToggle}
            onEdit={setEditingTask}
            onDelete={handleDelete}
            timerStates={timerStates}
            onTimerToggle={handleTimerToggle}
            onTimerReset={handleTimerReset}
          />
        )}
        {view === "month" && (
          <MonthView
            currentDate={currentDate}
            tasks={filteredTasks}
            onAdd={handleAdd}
            onToggle={handleToggle}
            onEdit={setEditingTask}
            onDelete={handleDelete}
            onDayClick={handleDayClick}
            timerStates={timerStates}
            onTimerToggle={handleTimerToggle}
            onTimerReset={handleTimerReset}
          />
        )}
        {view === "year" && (
          <YearView currentDate={currentDate} onMonthClick={handleMonthClick} />
        )}
      </main>

      {/* Edit Modal */}
      {editingTask && (
        <EditModal
          task={editingTask}
          onSave={handleEditSave}
          onCancel={() => setEditingTask(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
