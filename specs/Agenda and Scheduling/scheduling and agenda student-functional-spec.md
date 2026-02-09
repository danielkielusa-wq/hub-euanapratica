# STUDENT FUNCTIONAL SPECIFICATION
## HUB EUA NA PRÁTICA - Scheduling System

---

## ROLE OVERVIEW

**Students** are the primary users who book mentoring sessions through the platform.

### What Students Can Do:
- View only services they're entitled to
- Book sessions (if entitled and within limits)
- Reschedule/cancel their own bookings (within policy windows)
- View their booking history

### What Students Cannot Do:
- See mentor availability grids directly (only available time slots)
- Book beyond their concurrent booking limit
- See other students' bookings

---

## BOOKING FLOW

### Step 1: Service Selection

**What happens:**
1. System fetches all services the student is entitled to
2. Display service cards showing: name, duration, mentor type
3. Non-entitled services are completely hidden (not grayed out)
4. If no services entitled → show empty state

**User actions:**
- Click on a service card → proceed to calendar

**Validation:**
- Service must be assigned to the mentor
- Service must be active
- Student must have valid entitlement

---

### Step 2: Calendar & Time Selection

**What happens:**
1. System calculates available time slots for selected service
2. Display weekly calendar with available slots only
3. Show student's timezone clearly
4. Unavailable slots are not shown or are clearly disabled

**Available Slot Calculation Logic:**
The system must:
1. Get the mentor's availability rules for the selected service (recurring weekly schedule)
2. Subtract the mentor's blocked time periods
3. Subtract existing confirmed bookings (mentor can't double-book)
4. Apply service buffer times (before/after)
5. Apply booking notice period (can't book within X hours)
6. Check student's concurrent booking limit
7. Return slots in student's timezone

**User actions:**
- Navigate between weeks (previous/next)
- Click available time slot → highlight selection
- Click "Continue" when slot selected → open confirmation popup

**Edge cases to handle:**
- Two students selecting same slot simultaneously (race condition)
- Mentor removes availability while student is viewing calendar
- Timezone conversion accuracy (DST transitions)

---

### Step 3: Booking Confirmation Popup

**What happens:**
1. Display all booking details for final review
2. Show cancellation/reschedule policy
3. Reserve the slot temporarily (optional, or handle in next step)

**User actions:**
- Confirm booking → create booking in system
- Go back → return to calendar (keep slot selected)

**When booking is confirmed:**
1. Create booking record with the mentor assigned, status "confirmed"
2. Verify the mentor has no conflicts at this time:
   - Check existing bookings (no conflicts)
   - Check blocked time (no conflicts)
   - Apply buffer times
3. Log booking creation in history
4. Send confirmation email (using mentor's template or default)
5. Show success state

**Validation before creating booking:**
- Double-check slot is still available (race condition protection)
- Student hasn't exceeded max concurrent bookings
- Booking is within future horizon limit
- Booking meets minimum notice period
- Student entitlement is still valid

**If validation fails:**
- Show specific error message
- Return to calendar with error state
- Auto-refresh available slots

---

### Step 4: My Bookings (Upcoming & Past)

**What happens:**
1. System fetches student's bookings
2. Separate into "Upcoming" and "Past" tabs
3. Sort upcoming by nearest date first
4. Display status badges with colors

**Booking statuses:**
- **Confirmed** = scheduled and not yet occurred (green)
- **Completed** = mentor marked as completed after session time (blue)
- **Canceled** = student or system canceled (gray)
- **No-show** = student didn't attend OR canceled too late (red)

**Reschedule/Cancel button visibility:**
Calculate dynamically based on:
- Current time vs scheduled time
- System rules: cancellation_window_hours
- System rules: reschedule_limit_per_booking
- Booking's reschedule_count

**Show "Reschedule" button if:**
- Status is "confirmed"
- Current time is more than reschedule_window_hours before session
- reschedule_count < reschedule_limit

**Show "Cancel" button if:**
- Status is "confirmed"  
- Current time is more than cancellation_window_hours before session

**If student cancels within window:**
- Either block cancellation with error message, OR
- Allow but mark as "no-show" (based on system rule)

---

### Step 5: Rescheduling

**What happens:**
1. Show reschedule popup with current booking details
2. Display calendar with available slots (same logic as initial booking)
3. Check if student is within reschedule window
4. If too close to session → show policy warning

**When student confirms reschedule:**
1. Validate reschedule is allowed (within window, under limit)
2. Find available slot with the mentor
3. Update booking record:
   - Update scheduled_date and scheduled_time
   - Increment reschedule_count
   - Keep same booking ID
4. Log reschedule action in booking_history
5. Send reschedule confirmation email
6. Show success message

---

## CRITICAL BUSINESS RULES

### Concurrent Booking Limits

**Rule:** Students cannot exceed the maximum concurrent bookings set by admin

**How it works:**
- System rules define: max concurrent bookings per student (e.g., 3)
- Only "confirmed" bookings count toward limit
- Completed, canceled, and no-show bookings don't count

**Example scenario:**
1. System max = 3 concurrent bookings
2. Student has 3 "confirmed" bookings
3. Student tries to book 4th session → BLOCKED
4. Error shown: "You have reached the maximum of 3 concurrent bookings. Complete or cancel an existing session to book more."

**When limit frees up:**
- Student completes a session (mentor marks as completed) → opens 1 slot
- Student cancels a booking → opens 1 slot
- Booking marked as no-show → opens 1 slot

---

### Cancellation Policy

**Cancellation Window:**
- Set by admin (e.g., 24 hours before session)
- Students can cancel freely if MORE than X hours before
- If within window → either blocked OR marked as no-show

**Late Cancellation Behavior:**

**Option A: Block cancellation**
- If student tries to cancel within 24h → show error
- "You cannot cancel within 24 hours of your session. Please contact support."
- Booking remains "confirmed"

**Option B: Allow but mark as no-show**
- Student can cancel within 24h
- Booking automatically marked as "no-show"
- Counts against student record
- "Warning: Canceling within 24 hours will be marked as a no-show."

---

### Reschedule Policy

**Reschedule Window:**
- Set by admin (e.g., 24 hours before session)
- Students can reschedule if MORE than X hours before
- If within window → blocked with error message

**Reschedule Limit:**
- Set by admin (e.g., 2 reschedules per booking)
- Each booking tracks reschedule_count
- After limit reached → "Reschedule" button disabled
- Error shown: "You have reached the reschedule limit for this booking."

**Example:**
- Limit = 2 reschedules
- Student books session → reschedule_count = 0
- Student reschedules once → reschedule_count = 1
- Student reschedules again → reschedule_count = 2 (LIMIT REACHED)
- "Reschedule" button disappears

---

### Future Booking Horizon

**Rule:** Students cannot book beyond X days in the future

**How it works:**
- Admin sets horizon (e.g., 30 days)
- Calendar only shows slots within next 30 days
- If student tries to navigate beyond → disabled/grayed out
- Error: "Bookings can only be made up to 30 days in advance."

---

### Booking Notice Period

**Rule:** Students cannot book sessions too close to current time

**How it works:**
- Each service has a "booking notice period" (e.g., 2 days)
- Student cannot book sessions within next 48 hours
- Only slots 48+ hours away are shown as available
- This gives mentor time to prepare

**Example:**
- Today is Monday 10:00 AM
- Service requires "2 days notice"
- Earliest bookable slot: Wednesday 10:00 AM (or later)
- Tuesday slots are not shown/disabled

---

## EMAIL NOTIFICATIONS

Students receive emails at these events:

### 1. Booking Confirmation
**When:** Immediately after confirming booking
**Template variables:** student_name, service_name, date, time, duration, mentor_name, reschedule_link, cancel_link

### 2. 24-Hour Reminder
**When:** Exactly 24 hours before scheduled session
**Template variables:** student_name, service_name, date, time, mentor_name

### 3. 1-Hour Reminder
**When:** Exactly 1 hour before scheduled session
**Template variables:** student_name, service_name, date, time, mentor_name

### 4. Session Completed
**When:** Mentor marks session as "completed"
**Template variables:** student_name, service_name, date, mentor_name

### 5. Cancellation Notice
**When:** Student cancels booking
**Template variables:** student_name, service_name, date, time, cancellation_reason

### 6. Reschedule Confirmation
**When:** Student reschedules booking
**Template variables:** student_name, service_name, old_date, old_time, new_date, new_time, mentor_name

### 7. No-Show Notification (if applicable)
**When:** Booking automatically marked as no-show
**To:** Student
**Template variables:** student_name, service_name, date

---

## STATE MANAGEMENT

### Student-Specific State
- List of entitled services
- Selected service for booking
- Available time slots for selected service
- Selected time slot
- List of student's bookings (upcoming and past)
- Booking being rescheduled (if any)

### Global State (relevant to students)
- Current authenticated user (id, name, email, timezone)
- Active route/page
- Global loading state
- Global error state

### UI State
- Modal/popup open/closed (confirmation, reschedule)
- Form field values
- Form validation errors
- Loading states (per action: booking, rescheduling, canceling)
- Success/error messages (transient)

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
- ✅ "This time slot is no longer available. Please select another time."
- ✅ "You have reached the maximum of 3 concurrent bookings. Complete or cancel an existing session to book more."
- ✅ "You cannot reschedule within 24 hours of your session. Please contact support if you need assistance."
- ✅ "This service requires 2 days notice. Please select a time slot at least 2 days in advance."

**Bad error messages:**
- ❌ "Error 400: Bad Request"
- ❌ "Something went wrong"
- ❌ "Database connection failed"

### Network Errors
If request fails:
- Show generic network error message
- Provide "Retry" button
- Don't lose user's input data
- Log error for debugging (but don't show to user)

### Validation Errors
- Show inline validation errors below form fields
- Highlight invalid fields with red border
- Disable submit button until all fields valid
- Show form-level error summary if multiple issues

### Loading States
- Show spinner or skeleton for loading content
- Disable buttons during submission to prevent double-clicks
- Show "Checking availability..." while fetching slots
- Never show blank screen during loading

---

## TIMEZONE HANDLING

**Critical Requirements:**
- All times stored in database in UTC
- Display times in student's timezone
- Timezone must be captured and stored for each booking
- Handle DST transitions correctly

**Display Logic:**
- Student sees all times in their own timezone
- Timezone indicator shown clearly (e.g., "2:00 PM EST")
- Calendar header shows: "Times shown in: Eastern Standard Time (EST)"

**Example:**
- Student in EST books session
- Mentor in PST delivers session
- Session stored as: 2026-02-10 19:00:00 UTC
- Student sees: Feb 10, 2:00 PM EST
- Confirmation email shows: Feb 10, 2:00 PM EST

**DST Handling:**
- If student books session for March 10 at 2:00 PM (before DST)
- And session occurs March 15 (after DST started)
- Time must adjust correctly to maintain local time

---

## CRITICAL EDGE CASES

### Race Condition: Two Students Book Same Slot

**Scenario:**
1. Student A selects slot at 2:00 PM → opens confirmation popup
2. Student B selects same slot at 2:00 PM → opens confirmation popup
3. Student A clicks "Confirm Booking" first → booking created successfully
4. Student B clicks "Confirm Booking" 2 seconds later → must FAIL

**Solution:**
- Use database transactions or optimistic locking
- Recheck availability immediately before creating booking
- Student B sees error: "This time slot is no longer available. Please select another time."
- Auto-refresh calendar to show updated availability
- Provide smooth UX (not a generic error page)

---

### Slot Becomes Unavailable During Viewing

**Scenario:**
1. Student opens calendar showing 10 available slots
2. Mentor simultaneously removes availability for 3 of those slots
3. Student selects one of the removed slots
4. Student clicks "Continue" → validation must catch this

**Solution:**
- Validate slot availability server-side before booking
- Don't trust client-side state alone
- Show error: "This slot is no longer available. Please select another time."
- Refresh calendar automatically
- Keep student's service selection (don't send back to service list)

---

### Concurrent Booking Limit Reached

**Scenario:**
1. Student has 2 confirmed bookings (max = 3)
2. Student opens booking flow in two browser tabs
3. In Tab 1: Books session → now has 3 bookings
4. In Tab 2: Tries to book another → must fail

**Solution:**
- Check limit server-side at booking creation time
- Show error: "You have reached the maximum of 3 concurrent bookings."
- Suggest: "Complete or cancel an existing session to book more."
- Don't let client-side check alone determine availability

---

## ACCESSIBILITY REQUIREMENTS

The student interface must be accessible:
- Keyboard navigation works for all interactions
- Focus indicators visible on all interactive elements
- Color is not the only indicator of state (use icons + color)
  - Confirmed = green + checkmark icon
  - No-show = red + warning icon
  - Canceled = gray + X icon
- Alt text on all icons
- Form labels properly associated with inputs
- Error messages announced to screen readers
- Proper heading hierarchy (H1 → H2 → H3)
- Sufficient color contrast (WCAG AA minimum)

---

## MOBILE RESPONSIVENESS

While desktop-first, the student interface should work on mobile:
- Calendar switches to day view or scrollable time slots
- Modals become full-screen on small screens
- Service cards stack vertically
- Touch targets minimum 44x44px
- Forms stack vertically on narrow screens
- "My Bookings" table becomes stacked cards

---

## PERFORMANCE REQUIREMENTS

The student interface should:
- Load initial page in under 2 seconds
- Show calendar availability in under 1 second
- Complete booking submission in under 2 seconds
- Refresh data without full page reload
- Use optimistic UI updates where safe
- Cache available slots for 30 seconds (reduce redundant requests)

---

## TESTING SCENARIOS

### Happy Path
1. Login as student
2. View entitled services (should see at least 1)
3. Select a service
4. View available time slots (should see multiple slots)
5. Select a slot and click "Continue"
6. Review booking details in confirmation popup
7. Click "Confirm Booking"
8. See success message
9. Verify booking appears in "My Bookings" → "Upcoming" tab
10. Reschedule the booking to a different time
11. Verify updated time in "My Bookings"
12. Cancel the booking
13. Verify booking moves to "Past" tab with "Canceled" status

### Edge Cases to Test
1. **No entitled services** → Show empty state with helpful message
2. **No available slots** → Show "No availability" message, suggest checking back later
3. **Concurrent booking limit reached** → Block booking with clear error
4. **Try to book same slot twice** → Second attempt fails with error
5. **Try to cancel within cancellation window** → Block or mark as no-show (based on rules)
6. **Try to reschedule beyond limit** → Disable reschedule button
7. **Try to reschedule within reschedule window** → Show error
8. **Select slot that becomes unavailable** → Catch during confirmation, show error
9. **Network error during booking** → Show retry button, don't lose data
10. **Timezone change** → All times displayed correctly in new timezone

---

## SUCCESS CRITERIA

The student interface is complete when:
- [ ] Students can view their entitled services
- [ ] Students can see available time slots in their timezone
- [ ] Students can book sessions successfully
- [ ] Concurrent booking limit is enforced
- [ ] Students can reschedule within policy limits
- [ ] Students can cancel within policy limits
- [ ] Race conditions are prevented (two students, same slot)
- [ ] All validation errors are user-friendly
- [ ] All email notifications are sent correctly
- [ ] Timezone handling works correctly
- [ ] Mobile interface works smoothly
- [ ] Accessibility requirements are met
- [ ] Performance meets requirements

---

## NOTES FOR IMPLEMENTATION

**What you should focus on:**
- Robust client-side validation PLUS server-side validation
- Preventing race conditions in booking
- Excellent error messages
- Smooth loading states (never blank screens)
- Clear timezone indicators
- Mobile-friendly calendar interaction

**What you can decide:**
- State management library choice
- Data fetching patterns
- Component structure
- Calendar UI library (if any)
- Styling approach

**What success looks like:**
A student can confidently book, reschedule, and manage their mentoring sessions without confusion, errors, or frustration. The experience should feel professional and reliable.
