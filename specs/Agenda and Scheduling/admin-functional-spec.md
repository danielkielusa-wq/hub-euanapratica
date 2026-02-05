# ADMIN FUNCTIONAL SPECIFICATION
## HUB EUA NA PRÁTICA - Scheduling System

---

## ROLE OVERVIEW

**Admins** are system administrators who configure and manage the scheduling platform but do not book or deliver sessions.

### What Admins Can Do:
- Create/edit/delete services
- Manage the mentor account and assign them to services
- Configure all system-wide scheduling rules
- View system analytics (read-only)

### What Admins Cannot Do:
- Book sessions (that's for students)
- Access student/mentor booking interfaces
- Modify individual bookings directly
- Set availability (that's for the mentor)

---

## CORE RESPONSIBILITIES

The admin's primary responsibilities are:
1. **Configure services** that students can book
2. **Manage the mentor** account and service assignments
3. **Set system-wide rules** for cancellation, rescheduling, and booking limits
4. **Monitor system health** through analytics dashboard

---

## SERVICE MANAGEMENT

### Creating a New Service

**What happens:**
1. Admin clicks "Create New Service" button
2. Opens service creation form
3. Admin fills in all required fields
4. Optionally assigns service to the mentor
5. Saves service

**Service configuration fields:**

**Basic Information:**
- **Name** (required) - e.g., "Interview Prep", "Resume Review"
  - Max 200 characters
  - Must be unique
- **Description** (optional) - Details about the service
  - Max 1000 characters
  - Shown to students on service selection
- **Service type/category** (optional) - e.g., "Career Coaching", "Technical"
  - Used for grouping/filtering

**Timing Configuration:**
- **Duration** (required) - Select from dropdown:
  - 15 minutes
  - 30 minutes
  - 45 minutes
  - 60 minutes
  - 90 minutes
  - 120 minutes

- **Buffer before** (required) - Select from dropdown:
  - 0 minutes (no buffer)
  - 15 minutes
  - 30 minutes
  - Purpose: Blocks time before session for mentor prep

- **Buffer after** (required) - Select from dropdown:
  - 0 minutes (no buffer)
  - 15 minutes
  - 30 minutes
  - Purpose: Blocks time after session for notes, wind-down

**Buffer Time Example:**
If service has:
- Duration: 60 min
- Buffer before: 15 min  
- Buffer after: 15 min

Then a 2:00 PM session actually blocks: **1:45 PM - 3:15 PM** (90 min total)

Students cannot book another session from 1:45-3:15, ensuring mentor has prep and wrap-up time.

**Booking Rules:**
- **Booking notice period** (required) - Select from dropdown:
  - Same day (can book today)
  - 1 day in advance
  - 2 days in advance
  - 3 days in advance
  - 1 week in advance
  - Purpose: Gives mentor time to prepare

**Booking Notice Example:**
If set to "2 days in advance":
- Today is Monday 10:00 AM
- Student cannot book sessions before Wednesday 10:00 AM
- Earliest bookable slot: Wednesday 10:00 AM or later

**Mentor Assignment:**
- **Assigned to mentor** (checkbox)
  - Check = mentor can deliver this service, set availability for it
  - Uncheck = mentor cannot deliver this service
  - Students can only book services that are assigned to the mentor

**Status:**
- **Active** (toggle)
  - Active = students can see and book this service
  - Inactive = hidden from students, cannot be booked
  - Used for temporarily disabling a service without deleting

**Validation:**
- Service name cannot be empty
- Service name must be unique
- Duration must be selected
- Buffers and notice period must be selected
- If mentor checkbox is unchecked, warn: "Students will not be able to book this service until it's assigned to the mentor"

---

### Editing an Existing Service

**What happens:**
1. Admin selects service from list
2. Opens edit form with current values pre-filled
3. Admin modifies fields
4. Saves changes

**Important considerations when editing:**

**Changing Duration:**
- Example: Service is 60 minutes, change to 90 minutes
- Existing bookings remain 60 minutes (grandfathered)
- New bookings use 90 minutes
- Warning shown: "Existing bookings will keep their original duration. This change only affects new bookings."

**Changing Buffers:**
- Same grandfathering logic
- Existing bookings use old buffers
- New bookings use new buffers

**Changing Notice Period:**
- Applies to new bookings immediately
- Existing bookings unaffected
- May cause currently visible slots to disappear if notice period increased

**Unassigning from Mentor:**
- Check for upcoming bookings
- If bookings exist → show warning:
  - "This service has 5 upcoming bookings. If you unassign the mentor, students will not be able to book new sessions."
- Confirm action
- When unassigned:
  - Existing bookings remain intact
  - Mentor's availability for this service is hidden (but not deleted)
  - Students cannot book new sessions
  - Service shows "Not assigned to mentor" badge

**Deactivating Service:**
- Check for upcoming bookings
- If bookings exist → show info:
  - "This service has 3 upcoming bookings. They will remain scheduled. Students cannot book new sessions while inactive."
- When deactivated:
  - Hidden from student service selection
  - Existing bookings remain
  - Mentor can still view and deliver sessions
  - Can be reactivated anytime

---

### Deleting a Service

**Critical operation - requires extra confirmation**

**What happens:**
1. Admin clicks "Delete" button on service
2. System checks for upcoming bookings
3. If bookings exist → show warning:
   - "⚠️ WARNING: This service has 12 upcoming bookings"
   - "Deleting will cancel all these bookings and notify students"
   - List first 5 bookings with dates/students
4. Require admin to type "DELETE" in text field to confirm
5. When confirmed and deleted:
   - Cancel all upcoming bookings
   - Remove mentor assignment
   - Send cancellation emails to all affected students
   - Mark service as deleted (soft delete - keep in database for history)
   - Past/completed bookings remain for records

**Soft delete explained:**
- Service is not actually removed from database
- Marked as `deleted: true`
- Hidden from all lists/dropdowns
- Historical data preserved for reporting
- Cannot be restored (must create new service)

**When to delete vs deactivate:**
- **Deactivate:** Temporary pause, may resume later
- **Delete:** Permanent removal, service no longer relevant

---

## SYSTEM RULES CONFIGURATION

### Overview

System rules are **global settings** that apply to all students and all services. These define the policies for booking, canceling, rescheduling, and no-shows.

---

### Cancellation Policy

**Cancellation Window:**
- Admin selects from dropdown:
  - 1 hour before session
  - 3 hours before session
  - 6 hours before session
  - 12 hours before session
  - 24 hours before session
  - 48 hours before session

**What this means:**
- Students can cancel **freely** if MORE than X hours before
- If within window (e.g., less than 24 hours) → behavior depends on next setting

**Late Cancellation Behavior (toggle):**

**Option A: Block cancellation (toggle OFF)**
- If student tries to cancel within window → blocked with error
- Error shown: "You cannot cancel within 24 hours of your session. Please contact support if you need assistance."
- Booking remains "confirmed"
- Student must attend or accept no-show

**Option B: Allow but mark as no-show (toggle ON)**
- Student can cancel within window
- Booking automatically marked as "no-show"
- Warning shown before confirming: "⚠️ Canceling within 24 hours will be marked as a no-show and may affect your booking privileges."
- Student can proceed or go back

**Example configuration:**
- Cancellation window: 24 hours
- Late cancellation behavior: ON (allow but mark no-show)
- Result: Student can cancel anytime, but <24h = no-show

---

### Reschedule Policy

**Reschedule Limit:**
- Admin selects from dropdown:
  - No limit (students can reschedule unlimited times)
  - 1 time per booking
  - 2 times per booking
  - 3 times per booking

**What this means:**
- Each booking tracks `reschedule_count`
- After limit reached, "Reschedule" button disabled
- Error: "You have reached the reschedule limit for this booking"

**Reschedule Window:**
- Admin selects from dropdown (same options as cancellation):
  - 1 hour before session
  - 3 hours before session
  - 6 hours before session
  - 12 hours before session
  - 24 hours before session
  - 48 hours before session

**What this means:**
- Students can reschedule if MORE than X hours before
- If within window → blocked with error
- Error: "You cannot reschedule within 24 hours of your session"

**Example configuration:**
- Reschedule limit: 2 times
- Reschedule window: 24 hours
- Result: Student can reschedule up to 2 times, but not within 24 hours

---

### No-Show Rules

**Auto-Mark as No-Show (toggle):**

**If enabled:**
- System automatically marks booking as "no-show" if student doesn't join
- Grace period: 15 minutes after start time (configurable)
- Example: Session at 2:00 PM, grace until 2:15 PM
- If student doesn't join by 2:15 PM → auto-marked no-show
- Requires integration with video call system (future feature)

**If disabled:**
- Mentor manually marks no-shows
- Mentor clicks "Mark as No-Show" after session

**No-Show Consequences (checkboxes):**

Multiple options can be selected:

**1. Count Against Booking Limit**
- If student accumulates X no-shows → reduce their concurrent booking limit
- Example: 2 no-shows → limit reduced from 3 to 2
- Admin defines threshold and penalty

**2. Send Notification to Student**
- Automatic email sent when marked as no-show
- Template customizable
- Informs student of policy and consequences

**3. Send Notification to Admin**
- Admin receives email when no-show occurs
- Allows admin to track patterns and take action
- Useful for identifying students who need support

**Example configuration:**
- Auto-mark: OFF (mentor decides)
- Consequences:
  - ✓ Count against limit (after 3 no-shows)
  - ✓ Notify student
  - ✓ Notify admin

---

### Booking Limits

**Max Concurrent Bookings Per Student:**
- Admin selects from dropdown: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

**What this means:**
- Student cannot have more than X **confirmed** bookings at the same time
- Only "confirmed" status counts
- Completed, canceled, no-show don't count toward limit
- When a session is completed → opens up slot for new booking

**Example:**
- Max = 3 concurrent bookings
- Student has: 2 confirmed, 1 completed, 1 canceled
- Current count toward limit: 2
- Student can book 1 more session

**Future Booking Horizon:**
- Admin selects from dropdown:
  - 1 week (7 days)
  - 2 weeks (14 days)
  - 1 month (30 days)
  - 2 months (60 days)
  - 3 months (90 days)

**What this means:**
- Students cannot book beyond X days in the future
- Calendar only shows slots within this window
- Example: If set to 1 month (30 days)
  - Today is Feb 1
  - Students can book up to March 3 (30 days from now)
  - Cannot book March 4 or later
- As days pass, new dates become available
- Prevents students from hoarding distant appointments

---

### When Rules Change

**Important principle: Grandfathering**

When admin changes system rules:
- **New rules apply to NEW bookings only**
- **Existing bookings maintain their original rules**

**Example:**
- Original rule: 3 reschedules allowed, 12-hour cancellation window
- Student books session (rule snapshot saved with booking)
- Admin changes to: 1 reschedule allowed, 24-hour cancellation window
- Student's existing booking: still follows old rules (3 reschedules, 12h window)
- Student's new bookings: follow new rules (1 reschedule, 24h window)

**Why grandfathering:**
- Fair to students who booked under different rules
- Prevents confusion ("rules changed after I booked")
- Maintains contract integrity

**Implementation:**
- Store rule snapshot with each booking record
- Use booking's rules, not current system rules, for validation
- Admin cannot retroactively change existing booking rules

---

## MENTOR MANAGEMENT

### Overview

The platform has **exactly one mentor account**. Admin manages this single account, not a list of mentors.

---

### Editing Mentor Details

**What admin can do:**
1. Click "Edit Mentor" or "Mentor Settings"
2. Opens mentor profile form
3. Update fields
4. Save changes

**Editable fields:**

**Personal Information:**
- **First Name** (required) - Max 100 characters
- **Last Name** (required) - Max 100 characters
- **Email** (required) - Must be valid email format, unique
- **Specialization** (optional) - e.g., "Career Coach", "Interview Expert"
  - Max 200 characters
  - Shown to students in booking flow
- **Bio** (optional) - Mentor's background and expertise
  - Max 1000 characters
  - Shown to students in booking flow

**Account Status:**
- **Active** (toggle)
  - Active = mentor can login and deliver sessions
  - Inactive = mentor cannot login, cannot deliver sessions

**Validation:**
- First name, last name, email cannot be empty
- Email must be valid format
- Email must be unique (not used by student or admin account)

**When email changes:**
- Send verification email to new address
- Notify mentor of change
- Update all future emails to use new address

---

### Assigning Services to Mentor

**What admin can do:**
1. In mentor edit form, see "Assigned Services" section
2. View list of all services with checkboxes
3. Check services to assign, uncheck to unassign
4. Save changes

**Assigning a service:**
- Check the service checkbox
- Mentor can now set availability for this service
- Mentor can deliver sessions for this service
- Students can book this service (if mentor has availability)

**Unassigning a service:**

**Before unassigning, system checks:**
1. Are there upcoming bookings for this service with this mentor?
2. If yes → show warning:
   - "⚠️ This mentor has 7 upcoming bookings for this service:"
   - List bookings with dates
   - "Unassigning will NOT cancel these bookings, but mentor cannot take new bookings."
3. Require confirmation

**When unassigned:**
- Mentor's availability for this service is hidden (not deleted)
- Existing bookings remain intact and will be delivered
- Students cannot book NEW sessions for this service
- Mentor can still view and complete existing sessions
- Service shows "Not assigned to mentor" in dashboard

**Can be reassigned:**
- Check the service again
- Mentor's previous availability rules are restored
- Students can book again

---

### Deactivating the Mentor Account

**Critical operation - affects entire platform**

**What happens:**
1. Admin toggles "Active" to OFF
2. System checks for upcoming bookings
3. If bookings exist → show warning:
   - "⚠️ WARNING: The mentor has 42 upcoming bookings"
   - "Deactivating will prevent the mentor from logging in and delivering sessions"
   - Options:
     - "Cancel all bookings and notify students"
     - "Keep bookings but deactivate account (mentor cannot login)"
4. Require confirmation

**When deactivated:**
- Mentor cannot login to platform
- Existing bookings: depends on admin's choice
  - Option A: Remain (students expect mentor to deliver)
  - Option B: Canceled (all students notified)
- No future bookings can be made (all services show "unavailable")
- Student booking interface shows "Mentor currently unavailable"

**Reactivating:**
- Admin toggles "Active" to ON
- Mentor can login again
- Services become bookable again (if assigned)
- Availability rules are restored

**Use cases:**
- Mentor on extended leave
- Mentor transitioning out
- Emergency suspension

---

## SYSTEM OVERVIEW DASHBOARD

### Overview

The dashboard provides **read-only analytics** to help admin monitor system health and activity. No actions can be taken from the dashboard - it's purely informational.

---

### Summary Cards (Top of Dashboard)

**Four key metrics:**

**1. Total Active Services**
- Count of services where `active = true` AND `deleted = false`
- Example: "5 Active Services"
- Click to navigate to services list

**2. Upcoming Sessions This Week**
- Count of bookings with `status = confirmed` AND `scheduled_date` within current week
- Example: "23 Upcoming Sessions"
- Click to see detailed list

**3. Total Bookings This Month**
- Count of all bookings (any status) created this month
- Example: "156 Bookings This Month"
- Includes confirmed, completed, canceled, no-show

**4. Mentor Availability Status**
- Badge showing if mentor has availability set
- "✓ Availability Set" (green) = mentor has at least 1 availability rule
- "⚠️ No Availability" (yellow) = mentor has 0 availability rules
- Critical indicator - if no availability, students cannot book

---

### Services Status Table

**Columns:**

1. **Service Name**
   - Name of the service
   - Click to edit service

2. **Status**
   - Active badge (green) = `active = true`
   - Inactive badge (gray) = `active = false`

3. **Assigned to Mentor?**
   - Yes badge (green) = assigned
   - No badge (red) = not assigned
   - Critical: if no, students cannot book

4. **Bookings This Week**
   - Count of confirmed bookings for this service in current week
   - Example: "7 bookings"
   - Shows demand/popularity

5. **Last Booking Date**
   - Date of most recent booking (any status) for this service
   - Example: "Feb 1, 2026"
   - If no bookings ever: "Never"
   - Helps identify unused services

**Sorting:**
- Default: alphabetical by name
- Can sort by any column
- Most useful: sort by "Bookings This Week" to see popular services

**Actions:**
- Click row → opens edit service form
- "Add New Service" button at top

---

### Mentor Status Panel

**Single panel showing mentor details:**

**Mentor Information:**
- Mentor name: "John Doe"
- Contact: john@example.com
- Specialization: "Career Coach & Interview Expert"

**Assigned Services:**
- Count and list: "5 services"
- Click to expand list:
  - Interview Prep (Active)
  - Resume Review (Active)
  - Mock Interview (Inactive)
  - Career Counseling (Active)
  - LinkedIn Optimization (Active)

**Availability Status:**
- Badge:
  - "✓ Availability Set" (green) = has availability rules
  - "⚠️ No Availability" (yellow) = no availability set
- Click "View Availability" → see mentor's schedule (read-only for admin)

**Upcoming Sessions:**
- Count: "18 upcoming sessions"
- Click to see list of confirmed bookings

**Last Active:**
- Date mentor last logged in
- Example: "Last active: Feb 2, 2026"
- Helps admin know if mentor is engaged

**Actions:**
- "Edit Mentor" button → opens mentor edit form
- "View All Sessions" → see all mentor's bookings

---

### System Health Indicators

**Warning/info badges to catch issues:**

**1. Services Without Mentor Assignment**
- Shows if any active services are not assigned to mentor
- "⚠️ 2 services need mentor assignment"
- Click to see which services
- Critical: these services cannot be booked

**2. Mentor Without Availability**
- Shows if mentor has zero availability rules set
- "⚠️ Mentor has not set availability for 3 services"
- Click to see which services
- Critical: students cannot book these services

**3. Students with No-Shows This Month**
- Info badge (not warning)
- "ℹ️ 5 students with no-shows this month"
- Click to see list of students and no-show counts
- Helps admin identify students who may need support

**4. Inactive Services with Upcoming Bookings** (if applicable)
- "ℹ️ 1 inactive service has 3 upcoming bookings"
- Click to see details
- Informational: bookings will still occur

---

### Analytics Filters

**Dashboard can be filtered by:**
- Date range (this week, this month, last 30 days, custom)
- Service type/category
- Booking status (all, confirmed, completed, canceled, no-show)

**Example use:**
- "Show me all no-shows in January 2026"
- "Show me bookings for Interview Prep service this month"

---

## STATE MANAGEMENT

### Admin-Specific State
- List of all services
- Service being edited (if any)
- Mentor details
- System rules configuration (current values)
- System overview analytics (cached for performance)
- Current dashboard filters

### Global State (relevant to admin)
- Current authenticated user (admin's info)
- Active route/page
- Global loading state
- Global error state

### UI State
- Modal/popup open/closed (edit service, edit mentor, delete confirmation)
- Form field values
- Form validation errors
- Loading states (per action: saving service, deleting service, updating rules)
- Success/error messages (transient)
- Dashboard filter selections

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
- ✅ "Service name 'Interview Prep' already exists. Please use a different name."
- ✅ "Cannot delete this service. It has 12 upcoming bookings. Cancel the bookings first or wait until they're completed."
- ✅ "Invalid email format. Please enter a valid email address."
- ✅ "Cannot unassign this service from mentor. There are 7 upcoming bookings. These bookings will remain scheduled, but students cannot book new sessions."

**Bad error messages:**
- ❌ "Error 409: Conflict"
- ❌ "Database error"
- ❌ "Invalid input"

### Validation Errors

**Form-level validation:**
- Required fields highlighted in red if empty
- Inline error messages below each field
- Error summary at top of form
- Submit button disabled until all fields valid

**Example service form validation:**
- Service name empty → "Service name is required"
- Service name duplicate → "A service with this name already exists"
- Duration not selected → "Please select a session duration"

### Confirmation Dialogs

**For destructive actions, use multi-step confirmation:**

**Example: Deleting a service**
1. Click "Delete" button
2. Show warning dialog:
   - "⚠️ Are you sure you want to delete 'Interview Prep'?"
   - "This service has 12 upcoming bookings."
3. If confirmed → show second dialog:
   - "Type DELETE to confirm"
   - Text input field
4. User types "DELETE"
5. "Delete" button enables
6. Click → service deleted

**Why multi-step:**
- Prevents accidental deletions
- Forces admin to read warning
- Ensures intentional action

---

## DATA VALIDATION REQUIREMENTS

### Service Creation/Edit Validation

**Before saving a service, verify:**
- [ ] Service name is not empty
- [ ] Service name is unique (case-insensitive)
- [ ] Service name is under 200 characters
- [ ] Duration is selected
- [ ] Buffer before is selected
- [ ] Buffer after is selected
- [ ] Booking notice period is selected
- [ ] If description provided, under 1000 characters

**If validation fails:**
- Highlight invalid fields
- Show specific error message
- Disable save button
- User corrects → errors clear → save button enables

---

### System Rules Validation

**Before saving system rules, verify:**
- [ ] Cancellation window is selected
- [ ] Reschedule window is selected
- [ ] Reschedule limit is selected
- [ ] Max concurrent bookings is selected (1-10)
- [ ] Future booking horizon is selected
- [ ] If auto no-show enabled, grace period is configured

**Warning if rules change significantly:**
- "⚠️ Changing cancellation window from 12h to 48h will affect all new bookings. Existing bookings keep their original rules."
- Require confirmation

---

### Mentor Edit Validation

**Before saving mentor details, verify:**
- [ ] First name is not empty (max 100 chars)
- [ ] Last name is not empty (max 100 chars)
- [ ] Email is not empty
- [ ] Email is valid format (regex check)
- [ ] Email is unique (not used by another user)
- [ ] Specialization under 200 characters (if provided)
- [ ] Bio under 1000 characters (if provided)

**Email change special handling:**
- Confirm email change with dialog
- Send verification to new email
- Old email receives notification

---

## ACCESSIBILITY REQUIREMENTS

The admin interface must be accessible:
- Keyboard navigation for all interactions
- Focus indicators visible on all interactive elements
- Color is not only indicator:
  - Active = green + checkmark icon
  - Inactive = gray + pause icon
  - Warning = yellow + warning triangle icon
  - Error = red + X icon
- Alt text on all icons
- Form labels properly associated
- Error messages announced to screen readers
- Proper heading hierarchy
- Sufficient color contrast (WCAG AA)
- Tables with proper headers for screen readers

---

## MOBILE RESPONSIVENESS

While desktop-first, the admin interface should work on mobile:
- Services table becomes stacked cards
- Dashboard summary cards stack vertically
- Forms stack vertically with full-width inputs
- Confirmation dialogs become full-screen modals
- Touch targets minimum 44x44px
- Horizontal scrolling for wide tables

---

## PERFORMANCE REQUIREMENTS

The admin interface should:
- Load dashboard in under 2 seconds
- Render services list in under 1 second
- Save service changes in under 2 seconds
- Refresh analytics without full page reload
- Cache dashboard data for 60 seconds
- Use pagination for long lists (>50 items)

---

## TESTING SCENARIOS

### Happy Path
1. Login as admin
2. View dashboard (see summary cards, services table, mentor panel)
3. Create a new service "Mock Interview"
   - Set duration: 60 min
   - Set buffers: 15 min before, 15 min after
   - Set notice: 2 days
   - Assign to mentor
   - Save
4. Verify service appears in services table
5. Edit system rules:
   - Cancellation window: 24 hours
   - Reschedule limit: 2 times
   - Max concurrent bookings: 3
   - Save
6. Edit mentor details:
   - Update specialization
   - Assign new service "Mock Interview"
   - Save
7. View dashboard health indicators (should show no warnings)

### Edge Cases to Test
1. **Create service with duplicate name** → Validation error
2. **Delete service with bookings** → Warning dialog, require "DELETE" confirmation
3. **Unassign service with bookings** → Warning with booking list
4. **Deactivate mentor with bookings** → Warning with count, choice to cancel or keep
5. **Change service duration** → Warning that existing bookings keep old duration
6. **Invalid email format** → Inline validation error
7. **Change mentor email** → Confirmation dialog, verification email sent
8. **Save rules with no changes** → Success message (no actual update)
9. **Network error during save** → Error message, retry button, don't lose data
10. **Dashboard with zero data** → Empty states with helpful messages

---

## SUCCESS CRITERIA

The admin interface is complete when:
- [ ] Admin can create, edit, and delete services
- [ ] Admin can configure all system-wide rules
- [ ] Admin can manage mentor account and service assignments
- [ ] Dashboard shows accurate real-time analytics
- [ ] Health indicators catch configuration issues
- [ ] All validation prevents invalid states
- [ ] Destructive actions have proper confirmations
- [ ] Warnings show for actions affecting existing bookings
- [ ] Changes to rules properly grandfather existing bookings
- [ ] Email notifications sent for mentor account changes
- [ ] Mobile interface works smoothly
- [ ] Accessibility requirements are met
- [ ] Performance meets requirements

---

## NOTES FOR IMPLEMENTATION

**What you should focus on:**
- Robust validation for all forms
- Clear warning dialogs for destructive actions
- Real-time dashboard updates
- Grandfathering logic for rule changes
- Excellent error messages
- Preventing invalid configurations (e.g., active service not assigned to mentor)

**What you can decide:**
- State management library choice
- Dashboard visualization library (charts/graphs)
- Component structure
- Table pagination approach
- Styling approach

**What success looks like:**
The admin can confidently configure the entire scheduling system, monitor its health, and make changes without breaking existing bookings or creating confusion for students/mentor. The interface should feel powerful yet safe, with guardrails preventing mistakes.

---

## SYSTEM-WIDE IMPLICATIONS

### How Admin Changes Affect Other Roles

**When admin creates/edits a service:**
- **Students:** See service appear/change in their service selection
- **Mentor:** See service in availability management (if assigned)

**When admin changes system rules:**
- **Students:** New bookings follow new rules
- **Existing bookings:** Keep original rules (grandfathered)

**When admin deactivates a service:**
- **Students:** Service disappears from selection
- **Mentor:** Service still visible but marked inactive
- **Existing bookings:** Remain intact

**When admin unassigns service from mentor:**
- **Students:** Cannot book new sessions for this service
- **Mentor:** Cannot set new availability for this service
- **Existing bookings:** Remain intact, mentor still delivers them

**When admin deactivates mentor:**
- **Students:** Cannot book any sessions (all services unavailable)
- **Mentor:** Cannot login
- **Existing bookings:** Depends on admin's choice (keep or cancel)

---

## CRITICAL EDGE CASES

### Deleting Service with Many Bookings

**Scenario:**
1. Admin wants to delete "Interview Prep" service
2. Service has 50 upcoming bookings
3. Deleting will cancel all and email 50 students

**Expected behavior:**
- Show warning with full count
- Require typing "DELETE" to confirm
- Show progress bar during cancellation process
- Send cancellation emails in batches (don't block UI)
- Show success message: "Service deleted. 50 students notified."
- If any email fails, show partial success: "Service deleted. 48 of 50 students notified. 2 email failures logged."

---

### Changing Rules to More Restrictive

**Scenario:**
1. Current rules: 3 reschedules, 12-hour cancellation window
2. Admin changes to: 1 reschedule, 48-hour cancellation window
3. Student has existing booking with 2 reschedules used (under old rule, can do 1 more)

**Expected behavior:**
- Existing booking follows old rules (still has 1 reschedule left)
- New bookings follow new rules (only 1 reschedule total)
- Warning shown before saving: "This change will make policies more restrictive. Existing bookings will keep their original rules."

---

### Unassigning Last Service from Mentor

**Scenario:**
1. Mentor has 5 services assigned
2. Admin unassigns all 5 services
3. Mentor has no services left

**Expected behavior:**
- Dashboard shows warning: "⚠️ Mentor has no assigned services. Students cannot book any sessions."
- Health indicator highlights this issue
- Mentor can still login but sees "No services assigned" message
- Admin should assign at least one service

---

### Email Change for Mentor

**Scenario:**
1. Mentor's current email: john@old.com
2. Admin changes to: john@new.com
3. Mentor has 20 upcoming bookings

**Expected behavior:**
- Confirmation dialog: "Change mentor email from john@old.com to john@new.com?"
- If confirmed:
  - Verification email sent to john@new.com
  - Notification sent to john@old.com
  - All future booking emails use john@new.com
  - Existing booking records updated with new email
- If verification fails or email invalid:
  - Revert change
  - Show error: "Email change failed. Please verify the new email address."

---

This completes the Admin Functional Specification. The admin has powerful control over the entire system but with appropriate safeguards to prevent mistakes.
