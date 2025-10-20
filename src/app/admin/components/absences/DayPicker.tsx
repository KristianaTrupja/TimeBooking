import { getDaysInMonth } from "@/app/utils/dateUtils";


function formatDate(year: number, month: number, day: string) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

export default function DayPicker(){
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const days = getDaysInMonth(2025, 10)
    return(
        <div className="flex w-fit gap-1 my-3 bg-gray-100 items-center border-t border-b sticky divide-x">
            {days.map((day, i) =>(
                <div className="p-1 px-2 text-center flex-1 max-w-9 h-full">{day}</div>
            ))}
        </div>
    )
}


            // {days.map((dayStr, colIndex) => {
            //     const day = parseInt(dayStr, 10);
            //     const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        
            //     const { isAbsentDay, absenceType } = useIsAbsentDay(absences, date);
            //     const { isHoliday, holidayTitle } = useDayHoliday(year, month, day, holidays);
            //     const today = day === todayDate && month === todayMonth && year === todayYear
        
            //     const classList = [
            //     "border-gray-300 w-9 h-9 flex justify-center items-center border-l font-semibold",
            //     isWeekend(year, month, day) && "bg-gray-300",
            //     isHoliday && "bg-green-100",
            //     isAbsentDay && "bg-orange-100",
            //     hoveredColIndex === colIndex && !isWeekend(year, month, day) && !isHoliday &&  "bg-[#f1f7fde7]",
            //     today &&
            //         "bg-blue-100 text-blue-700 font-extrabold border-blue-500"
            //     ]
            //     .filter(Boolean)
            //     .join(" ");
        
            //     const tooltip = [holidayTitle, absenceType && `Absence: ${absenceType}`]
            //     .filter(Boolean)
            //     .join(" | ");
        
            //     return (
            //     <div key={dayStr} title={tooltip} className={classList}>
            //         {dayStr}
            //     </div>
            //     );
            // })}