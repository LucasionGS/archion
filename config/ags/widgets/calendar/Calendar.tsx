import { Astal, Gtk, Gdk } from "astal/gtk3"
import { bind, Variable, GLib } from "astal"

interface CalendarProps {
    displayCalendar: Variable<boolean>
}

export default function Calendar({ displayCalendar }: CalendarProps) {
    const currentDate = Variable(new Date())
    const selectedDate = Variable(new Date())

    // Month names for display
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    // Day names
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Get days in month
    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay()
    }

    // Navigate months
    const navigateMonth = (direction: 'prev' | 'next') => {
        const current = currentDate.get()
        const newDate = new Date(current)
        
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1)
        } else {
            newDate.setMonth(newDate.getMonth() + 1)
        }
        
        currentDate.set(newDate)
    }

    // Navigate years
    const navigateYear = (direction: 'prev' | 'next') => {
        const current = currentDate.get()
        const newDate = new Date(current)
        
        if (direction === 'prev') {
            newDate.setFullYear(newDate.getFullYear() - 1)
        } else {
            newDate.setFullYear(newDate.getFullYear() + 1)
        }
        
        currentDate.set(newDate)
    }

    // Generate calendar grid function that returns widgets array
    const generateCalendarGrid = () => {
        const current = currentDate.get()
        const month = current.getMonth()
        const year = current.getFullYear()
        const today = new Date()
        
        const daysInMonth = getDaysInMonth(month, year)
        const firstDay = getFirstDayOfMonth(month, year)
        
        const days: (number | null)[] = []
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null)
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day)
        }
        
        // Group into weeks (rows of 7)
        const weeks: (number | null)[][] = []
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7))
        }
        
        return weeks.map((week, weekIndex) => 
            <box className="calendar-week">
                {week.map((day, dayIndex) => {
                    const isToday = day !== null && 
                        month === today.getMonth() && 
                        year === today.getFullYear() && 
                        day === today.getDate()
                    
                    const isSelected = day !== null && 
                        month === selectedDate.get().getMonth() && 
                        year === selectedDate.get().getFullYear() && 
                        day === selectedDate.get().getDate()
                    
                    return (
                        <button
                            className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${day === null ? 'empty' : ''}`}
                            onClicked={() => {
                                if (day !== null) {
                                    selectedDate.set(new Date(year, month, day))
                                }
                            }}
                            child={<label label={day?.toString() || ""} />}
                        />
                    )
                })}
            </box>
        )
    }

    return (
        <window
            name="calendar"
            className="Calendar"
            visible={bind(displayCalendar)}
            anchor={Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.RIGHT}
            exclusivity={Astal.Exclusivity.NORMAL}
            // keymode={Astal.Keymode.EXCLUSIVE}
            onKeyPressEvent={(self, event) => {
                if (event.get_keyval()[1] === Gdk.KEY_Escape) {
                    displayCalendar.set(false)
                }
            }}
            child={
                <box className="calendar-container" vertical>
                    {/* Header with navigation */}
                    <box className="calendar-header">
                        <box className="calendar-nav">
                            <button 
                                className="nav-button"
                                onClicked={() => navigateYear('prev')}
                                tooltipText="Previous Year"
                                child={<icon icon="go-first-symbolic" />}
                            />
                            <button 
                                className="nav-button"
                                onClicked={() => navigateMonth('prev')}
                                tooltipText="Previous Month"
                                child={<icon icon="go-previous-symbolic" />}
                            />
                        </box>
                        
                        <box className="calendar-title" hexpand>
                            {[<label 
                                className="month-year-label"
                                label={bind(currentDate).as(date => 
                                    `${monthNames[date.getMonth()]} ${date.getFullYear()}`
                                )}
                            />]}
                        </box>
                        
                        <box className="calendar-nav">
                            <button 
                                className="nav-button"
                                onClicked={() => navigateMonth('next')}
                                tooltipText="Next Month"
                                child={<icon icon="go-next-symbolic" />}
                            />
                            <button 
                                className="nav-button"
                                onClicked={() => navigateYear('next')}
                                tooltipText="Next Year"
                                child={<icon icon="go-last-symbolic" />}
                            />
                        </box>
                    </box>

                    {/* Day names header */}
                    <box className="calendar-day-names">
                        {dayNames.map(dayName => 
                            <label 
                                className="day-name"
                                label={dayName}
                            />
                        )}
                    </box>

                    {/* Calendar grid */}
                    <box className="calendar-grid" vertical>
                        {bind(currentDate).as(() => generateCalendarGrid())}
                    </box>

                    {/* Footer with selected date info */}
                    <box className="calendar-footer">
                        {[<label 
                            className="selected-date-label"
                            label={bind(selectedDate).as(date => 
                                `Selected: ${date.toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}`
                            )}
                        />]}
                    </box>
                </box>
            }
        />
    )
}
