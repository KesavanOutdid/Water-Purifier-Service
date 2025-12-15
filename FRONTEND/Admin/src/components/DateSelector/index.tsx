"use client";

import { useState } from "react";

type DateSelectorProps = {
  onDateSelect: (date: string) => void;
  availableDates: string[];
};

export function DateSelector({ onDateSelect, availableDates }: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (availableDates.length === 0) {
    return null;
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const availableDateSet = new Set(
    availableDates.map((d) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    })
  );

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = selectedDate.toISOString().split("T")[0];
    onDateSelect(dateStr);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded border border-[#E8E8E8] bg-white px-4 py-2 text-sm font-medium text-dark outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
      >
        📅 Select Date
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-[#E8E8E8] bg-white shadow-lg dark:border-form-strokedark dark:bg-form-input">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-dark dark:text-white">{monthName}</h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="rounded border border-[#E8E8E8] px-2 py-1 text-dark dark:border-form-strokedark dark:text-white"
                >
                  ←
                </button>
                <button
                  onClick={handleNextMonth}
                  className="rounded border border-[#E8E8E8] px-2 py-1 text-dark dark:border-form-strokedark dark:text-white"
                >
                  →
                </button>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-medium text-dark dark:text-white">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isAvailable = availableDateSet.has(dateStr);

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    disabled={!isAvailable}
                    className={`flex h-8 items-center justify-center rounded text-sm font-medium transition-colors ${
                      isAvailable
                        ? "cursor-pointer hover:bg-primary hover:text-white dark:hover:bg-primary"
                        : "cursor-not-allowed text-gray-3 dark:text-gray-5"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
