# Calendar Widget

A fully functional calendar widget for the AGS desktop environment.

## Features

- **Monthly View**: Navigate through months with previous/next buttons
- **Yearly Navigation**: Jump between years with dedicated buttons
- **Visual Indicators**: 
  - Current day is highlighted in blue
  - Selected day is highlighted in purple
  - Today + Selected day gets a gradient highlight
- **Interactive**: Click on any date to select it
- **Responsive**: Automatically calculates month layout and handles different month lengths
- **Keyboard Support**: Press Escape to close the calendar

## Usage

### Opening the Calendar

1. **Click the Time**: Click on the time display in the top bar to open/close the calendar
2. **Command Line**: Use `ags request calendar toggle` to toggle the calendar
3. **Other Commands**:
   - `ags request calendar show` - Show the calendar
   - `ags request calendar hide` - Hide the calendar

### Navigation

- **Previous/Next Month**: Use the arrow buttons (◀ ▶) around the month title
- **Previous/Next Year**: Use the double arrow buttons (⏮ ⏭) at the edges
- **Select Date**: Click on any day number to select it
- **Close**: Press Escape or click outside the calendar

## Styling

The calendar uses a modern dark theme with:
- Semi-transparent background with blur effect
- Smooth animations and hover effects
- Blue highlighting for today's date
- Purple highlighting for selected dates
- Gradient effect when today is also selected

## Technical Details

- Built with TypeScript and SCSS
- Uses AGS (Astal) widget system
- Responsive grid layout for calendar days
- Proper handling of different month lengths and leap years
- Keyboard and mouse interaction support

## Integration

The calendar is integrated into the main AGS application and automatically:
- Loads with the desktop environment
- Receives styling from the main CSS
- Responds to system commands
- Maintains state across sessions
