# MENTOR FUNCTIONAL SPECIFICATION
## HUB EUA NA PRÁTICA - Scheduling System

---

## ROLE OVERVIEW

**The Mentor** is the single mentor account on the platform who delivers mentoring sessions to students.

### What the Mentor Can Do:
- Set availability schedules per service
- View assigned sessions
- Mark sessions as completed or no-show
- Block time across all services
- Add private notes to sessions
- Customize email notification templates

### What the Mentor Cannot Do:
- Create or delete services
- Cancel student bookings
- Modify system-wide rules
- See student information beyond name/email

---

## CORE RESPONSIBILITIES

The mentor's primary responsibilities are:
1. **Set availability** so students can book sessions
2. **Deliver sessions** at scheduled times
3. **Mark session outcomes** (completed or no-show)
4. **Manage schedule** by blocking time when unavailable

---

## AVAILABILITY MANAGEMENT

### Setting Availability Per Service

**What happens:**
1. Mentor selects a service from dropdown (only shows services assigned by admin)
2. System loads that service's current availability rules
3. Display weekly schedule grid (7 days × time slots)

**Visual states for each time slot:**
- **Available** (mentor set this as available) → green/clickable
- **Blocked** (mentor blocked this time) → red/disabled
- **Booked** (student has session here) → blue/locked

**Mentor actions:**
- Click empty slot → add to availability (turns green)
- Click available slot → remove from availability (turns empty)  
- Click "Block Time" button → open block time popup
- Click "Copy Week" → duplicate this week's pattern to next week
- Click "Save Changes" → persist availability rules

**How availability works:**

**Recurring Weekly Schedule:**
- Mentor sets: "Every Monday 9:00 AM - 12:00 PM" (available)
- This creates a recurring rule that applies to ALL future Mondays
- Students can book any slot within this window

**One-Time Availability:**
- Mentor can also set: "Only on March 15, 2026, 2:00 PM - 4:00 PM"
- This creates a single-day override
- Useful for special sessions or makeup times

**Key principle:**
- Availability changes only affect FUTURE bookings
- Existing confirmed bookings remain unchanged
- If you remove availability, students can't book NEW sessions in that time
- But confirmed sessions in that time still happen

**Validation:**
- Start time must be before end time
- No overlapping availability rules for same service + day
- Minimum slot duration: 15 minutes
- Must align with service duration (e.g., 60-min service needs 60-min slots)

**Warning scenarios:**

**Removing availability with existing bookings:**
1. Mentor has Monday 9-12 available
2. Student has booking: Monday Feb 10 at 10:00 AM
3. Mentor tries to remove Monday 9-12 availability
4. System shows warning: "You have 1 existing booking during this time (Feb 10 at 10:00 AM)"
5. Mentor can proceed → availability removed for future, Feb 10 booking stays

**Buffer times:**
- Each service has buffer before/after (set by admin)
- Example: 60-min session with 15-min buffer before and after
- If session booked at 2:00 PM, the system blocks 1:45 PM - 3:15 PM (90 min total)
- Mentor sees this as "Booked" in availability grid
- Students cannot book overlapping slots

---

### Blocking Time (Across All Services)

**What happens:**
1. Mentor clicks "Block Time" button
2. Opens popup with date/time picker
3. Mentor selects:
   - Start date
   - End date (for multi-day blocks)
   - Start time
   - End time
   - Reason (optional): vacation, conference, personal, etc.

**When blocking time:**
1. System creates blocked time record
2. **Applies across ALL services** mentor teaches
3. Checks for conflicts with existing bookings
4. If conflicts exist → show warning listing affected bookings:
   - "You have 3 existing bookings during this time:"
   - "Feb 15, 2:00 PM - Interview Prep - John Doe"
   - "Feb 16, 10:00 AM - Resume Review - Jane Smith"
   - "Feb 17, 3:00 PM - Interview Prep - Bob Johnson"
5. Mentor can:
   - Cancel block → go back and adjust dates
   - Proceed anyway → bookings remain, but no NEW bookings allowed

**Key principle:**
- Blocked time prevents NEW bookings
- Existing bookings are NOT automatically canceled
- Mentor must manually address conflicts (e.g., contact students)

**Use cases:**
- **Vacation:** Block Feb 20-27, 2026 (all day)
- **Conference:** Block March 5, 2026, 9:00 AM - 5:00 PM
- **Personal appointment:** Block Feb 15, 2:00 PM - 3:00 PM
- **Sick day:** Block today (emergency block)

**Editing/Deleting blocked time:**
- Mentor can view list of blocked time periods
- Click to edit or delete
- Deleting blocked time reopens those slots for booking

---

## SESSION MANAGEMENT

### Viewing Sessions

**What happens:**
1. System fetches all sessions assigned to the mentor
2. Filter options:
   - **All** sessions
   - **Upcoming** (confirmed, future)
   - **Past** (completed, no-show, canceled)
   - By service
   - By date range
3. Display in list or card format, sorted by date (nearest first)

**Each session card/row shows:**
- Service name
- Student name
- Date and time (in mentor's timezone)
- Duration
- Status badge (confirmed, completed, no-show, canceled)
- "View Details" button

**Session detail popup shows:**
- Service name (read-only)
- Student name and email (read-only)
- Scheduled date/time (read-only)
- Duration (read-only)
- Current status
- Text area for private notes
- Action buttons based on status and time

---

### Marking Session Outcomes

**After session time has passed, mentor can:**

**Mark as "Completed":**
- Click "Mark as Completed" button
- Optionally add private notes (e.g., "Student made great progress on mock interview")
- Status changes from "confirmed" → "completed"
- System sends "Session Completed" email to student
- Notes are stored but NOT shown to student

**Mark as "No-Show":**
- Click "Mark as No-Show" button
- Optionally add notes (e.g., "Student didn't join call, no notification")
- Status changes from "confirmed" → "no-show"
- System may send notification to student and/or admin (based on rules)
- May count against student's record (based on admin rules)

**Validation rules:**
- Can only mark status AFTER scheduled time has passed
  - If session is Feb 10 at 2:00 PM, button appears after 2:00 PM
  - If trying before 2:00 PM → button disabled or shows "Available after session time"
- Once marked completed or no-show → cannot change back to "confirmed"
- Can change completed ↔ no-show if needed (admin override)

**Private notes:**
- Stored per session
- Only mentor can see notes
- Students cannot see notes (privacy)
- Admins can see notes (for review if needed)
- Use for tracking student progress, issues, topics covered

---

## EMAIL TEMPLATE CUSTOMIZATION

### Overview

The mentor can customize all email templates sent to students. This allows for personal branding, tone, and specific instructions.

**6 customizable templates:**
1. **Booking Confirmation** - sent when student books
2. **24-Hour Reminder** - sent 24h before session
3. **1-Hour Reminder** - sent 1h before session
4. **Session Completed** - sent after mentor marks complete
5. **Cancellation Notice** - sent if student cancels
6. **Reschedule Confirmation** - sent when student reschedules

---

### Template Editor

**For each template, mentor can edit:**

**Subject Line:**
- Max 500 characters
- Can include template variables
- Example: "Your {{service_name}} session with {{mentor_name}} is confirmed!"

**Email Body:**
- Max 10,000 characters
- Rich text formatting: bold, italic, lists, links
- Insert template variables using dropdown or typing {{variable_name}}
- Preview pane shows sample with variables replaced

**Template Variables:**

Available variables (replaced when email sent):
- `{{student_name}}` → Student's full name
- `{{service_name}}` → Service name (e.g., "Interview Prep")
- `{{date}}` → Formatted date in student's timezone (e.g., "Feb 15, 2026")
- `{{time}}` → Formatted time in student's timezone (e.g., "2:00 PM EST")
- `{{duration}}` → Session duration (e.g., "60 minutes")
- `{{mentor_name}}` → Mentor's full name
- `{{reschedule_link}}` → Unique link for student to reschedule
- `{{cancel_link}}` → Unique link for student to cancel

**Required variables per template:**
- Booking Confirmation: must include {{date}}, {{time}}, {{service_name}}
- 24-Hour Reminder: must include {{date}}, {{time}}
- 1-Hour Reminder: must include {{time}}
- Session Completed: must include {{service_name}}
- Cancellation Notice: must include {{date}}, {{time}}
- Reschedule Confirmation: must include old and new date/time

**Editor features:**
- **Preview:** Shows email with sample data filled in
- **Send Test:** Sends test email to mentor's own email address
- **Reset to Default:** Reverts to system default template
- **Save:** Persists custom template

**Example custom template:**

**Subject:** "Excited for our {{service_name}} session!"

**Body:**
```
Hi {{student_name}},

Great news! Your {{service_name}} session is confirmed for {{date}} at {{time}}.

I'm looking forward to working with you. Here's what to prepare:

1. Review your resume or materials
2. Prepare 2-3 questions you'd like to discuss
3. Join the video call 5 minutes early

Session Details:
📅 Date: {{date}}
🕐 Time: {{time}} ({{duration}})
👤 Mentor: {{mentor_name}}

Need to reschedule? Use this link: {{reschedule_link}}
Need to cancel? Use this link: {{cancel_link}}

See you soon!
{{mentor_name}}
```

**Validation:**
- Subject cannot be empty
- Body cannot be empty
- Required variables must be present
- Max character limits enforced
- Links and formatting validated

**If mentor hasn't customized:**
- System uses default templates
- Template editor shows "Using default template" badge
- Mentor can click "Customize" to start editing

---

## EMAIL NOTIFICATIONS SENT TO MENTOR

The mentor receives emails at these events:

### 1. New Booking Notification
**When:** Immediately after student books a session
**Content:** Student name, service, date, time
**Purpose:** Inform mentor of new commitment

### 2. 24-Hour Reminder
**When:** 24 hours before session
**Content:** Upcoming session details
**Purpose:** Reminder to prepare

### 3. 1-Hour Reminder
**When:** 1 hour before session
**Content:** Imminent session details
**Purpose:** Final reminder to join

### 4. Student Cancellation
**When:** Student cancels a booking
**Content:** Canceled session details, student name, cancellation time
**Purpose:** Inform mentor that slot is now free

### 5. Student Reschedule
**When:** Student reschedules a booking
**Content:** Old and new session times
**Purpose:** Update mentor's calendar

---

## STATE MANAGEMENT

### Mentor-Specific State
- List of assigned services (from admin)
- Selected service for availability management
- Availability rules for selected service (recurring + one-time)
- List of blocked time periods
- List of upcoming sessions
- List of past sessions
- Email templates (all 6 types)
- Template being edited (if any)
- Current filters (service, date range, status)

### Global State (relevant to mentor)
- Current authenticated user (id, name, email, timezone)
- Active route/page
- Global loading state
- Global error state

### UI State
- Modal/popup open/closed (block time, session details, template editor)
- Form field values
- Form validation errors
- Loading states (per action: saving availability, marking session)
- Success/error messages (transient)
- Calendar view mode (week, month)

---

## ERROR HANDLING

### User-Facing Errors

All errors must:
- Be specific, not generic
- Explain what happened
- Suggest what to do next
- Be dismissible
- Not expose technical details

**Good error messages:**
- ✅ "Cannot remove this availability. You have 2 confirmed bookings during this time. Please contact the students or wait until the sessions are completed."
- ✅ "Session cannot be marked as completed yet. The scheduled time hasn't passed. You can mark it after 2:00 PM."
- ✅ "Template must include {{date}} and {{time}} variables for booking confirmations."
- ✅ "Blocked time overlaps with 3 existing bookings. Review the list below and decide if you want to proceed."

**Bad error messages:**
- ❌ "Error 500: Internal Server Error"
- ❌ "Invalid input"
- ❌ "Operation failed"

### Network Errors
If request fails:
- Show generic network error message
- Provide "Retry" button
- Don't lose mentor's input data (unsaved availability changes, notes)
- Log error for debugging

### Validation Errors
- Show inline validation errors below form fields
- Highlight invalid fields with red border
- Disable save button until all fields valid
- Show form-level error summary if multiple issues

### Loading States
- Show spinner while loading sessions
- Show skeleton calendar while loading availability
- Disable buttons during submission to prevent double-clicks
- Show "Saving..." while persisting changes
- Never show blank screen during loading

---

## TIMEZONE HANDLING

**Critical Requirements:**
- All times stored in database in UTC
- Display times in mentor's timezone
- Availability rules stored in mentor's timezone
- Mentor can see student's timezone in session details

**Display Logic:**
- Mentor sees all times in their own timezone
- Timezone indicator shown clearly (e.g., "2:00 PM PST")
- Calendar header shows: "Times shown in: Pacific Standard Time (PST)"
- In session details, shows both:
  - Mentor's timezone: "Feb 10, 11:00 AM PST"
  - Student's timezone: "Feb 10, 2:00 PM EST"

**Example:**
- Mentor in PST sets availability: Monday 9:00 AM - 5:00 PM PST
- Student in EST books: Feb 10, 2:00 PM EST
- Mentor sees session as: Feb 10, 11:00 AM PST
- Both are correct, just different timezones

**DST Handling:**
- If mentor sets availability before DST change
- And session occurs after DST starts
- System automatically adjusts to maintain local time
- Mentor doesn't need to manually update availability

---

## CRITICAL EDGE CASES

### Removing Availability with Existing Bookings

**Scenario:**
1. Mentor has weekly availability: Mondays 9-12 AM
2. Student has booking: Monday Feb 10 at 10:00 AM (confirmed)
3. Mentor removes Monday 9-12 AM availability

**Expected behavior:**
- System shows warning: "You have 1 existing booking during this time: Feb 10 at 10:00 AM with John Doe"
- Mentor can cancel or proceed
- If proceed: Availability removed for FUTURE Mondays
- Feb 10 booking remains confirmed and intact
- Students can no longer book NEW sessions on future Mondays 9-12

**Solution:**
- Availability rules control future booking attempts
- Existing bookings are independent records
- Don't auto-cancel bookings when availability removed
- Warn mentor so they can manually handle conflicts

---

### Blocking Time with Conflicts

**Scenario:**
1. Mentor wants to block Feb 20-22 for vacation
2. Has 5 confirmed sessions during this period

**Expected behavior:**
- System checks for conflicts
- Shows warning with full list:
  - "Feb 20, 10:00 AM - Interview Prep - Jane Doe"
  - "Feb 20, 2:00 PM - Resume Review - Bob Smith"
  - "Feb 21, 9:00 AM - Interview Prep - Alice Johnson"
  - etc.
- Mentor can:
  - Cancel → adjust vacation dates
  - Proceed → block created, bookings remain (mentor must manually contact students)
- If proceed: Future bookings during Feb 20-22 are blocked

**Solution:**
- Always check for conflicts before blocking
- Show full list of affected sessions
- Don't auto-cancel bookings
- Put responsibility on mentor to handle conflicts

---

### Marking Session Too Early

**Scenario:**
1. Session scheduled for Feb 10 at 2:00 PM
2. Current time is Feb 10 at 1:00 PM
3. Mentor tries to mark as completed

**Expected behavior:**
- "Mark as Completed" button is disabled
- Tooltip shows: "Available after 2:00 PM"
- If mentor tries anyway → error: "Session cannot be marked as completed yet. Please wait until the scheduled time has passed."

**Solution:**
- Validate server-side that current time > scheduled_time
- Don't trust client-side checks alone
- Provide clear feedback on when action will be available

---

### Template Missing Required Variables

**Scenario:**
1. Mentor edits "Booking Confirmation" template
2. Removes {{date}} variable from body
3. Tries to save

**Expected behavior:**
- Save button disabled
- Error shown: "Booking confirmation templates must include {{date}} and {{time}} variables."
- Highlight missing variables in editor
- Cannot save until fixed

**Solution:**
- Define required variables per template type
- Validate presence before saving
- Provide clear error about what's missing

---

## ACCESSIBILITY REQUIREMENTS

The mentor interface must be accessible:
- Keyboard navigation for all interactions
- Focus indicators visible on all interactive elements
- Color is not only indicator:
  - Available = green + checkmark icon
  - Blocked = red + block icon
  - Booked = blue + calendar icon
- Alt text on all icons
- Form labels properly associated
- Error messages announced to screen readers
- Proper heading hierarchy
- Sufficient color contrast (WCAG AA)

---

## MOBILE RESPONSIVENESS

While desktop-first, the mentor interface should work on mobile:
- Availability grid switches to list view or day-by-day
- Session list becomes stacked cards
- Template editor adapts to smaller screen
- Modals become full-screen
- Touch targets minimum 44x44px

---

## PERFORMANCE REQUIREMENTS

The mentor interface should:
- Load sessions list in under 1 second
- Render availability grid in under 1 second
- Save availability changes in under 2 seconds
- Refresh data without full page reload
- Use optimistic UI updates where safe
- Cache session data for 30 seconds

---

## TESTING SCENARIOS

### Happy Path
1. Login as mentor
2. Select a service from dropdown
3. Set availability: Monday-Friday 9 AM - 5 PM
4. Save changes
5. Block time for vacation: Feb 20-27
6. View upcoming sessions (should see confirmed bookings)
7. Wait for session time to pass (or mock system time)
8. Mark session as completed with notes
9. Edit "Booking Confirmation" email template
10. Preview template
11. Send test email
12. Save template

### Edge Cases to Test
1. **Remove availability with bookings** → Show warning, bookings persist
2. **Block time with conflicts** → Show warning with full list
3. **Try to mark session before time** → Disabled/error
4. **Template missing required variable** → Cannot save, error shown
5. **Overlapping availability rules** → Validation error
6. **Network error during save** → Show retry, don't lose data
7. **Student cancels session** → Mentor receives notification email
8. **Student reschedules session** → Mentor sees updated time
9. **Set availability across DST change** → Times adjust correctly
10. **Copy week with existing bookings** → Bookings stay, availability duplicated

---

## SUCCESS CRITERIA

The mentor interface is complete when:
- [ ] Mentor can set availability for all assigned services
- [ ] Mentor can block time for vacation/conflicts
- [ ] Mentor can view all upcoming and past sessions
- [ ] Mentor can mark sessions as completed or no-show
- [ ] Mentor can add private notes to sessions
- [ ] Mentor can customize all email templates
- [ ] Mentor can preview and test email templates
- [ ] All warnings for conflicts are shown correctly
- [ ] Validation prevents invalid states
- [ ] Email notifications are sent correctly
- [ ] Timezone handling works correctly
- [ ] Mobile interface works smoothly
- [ ] Accessibility requirements are met
- [ ] Performance meets requirements

---

## NOTES FOR IMPLEMENTATION

**What you should focus on:**
- Clear visualization of availability vs bookings vs blocked time
- Robust validation for overlapping rules
- Excellent warning messages for conflicts
- Smooth template editor with real-time preview
- Clear timezone indicators
- Preventing invalid session status changes

**What you can decide:**
- State management library choice
- Calendar UI library (if any)
- Rich text editor for email templates
- Component structure
- Styling approach

**What success looks like:**
The mentor can confidently manage their schedule, track sessions, and communicate professionally with students through customized emails. The interface should feel empowering and prevent mistakes.
