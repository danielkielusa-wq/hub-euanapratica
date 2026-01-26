

# Plan: Redesign Login Interface

## Overview
Recreate the login interface to match the reference image exactly, featuring a modern card-based profile selector with role switching, icon-prefixed inputs, and a clean modal-style layout.

---

## Analysis of Target Design

From the reference image, the new login interface includes:

1. **Modal-style Card Layout**
   - Clean white card with rounded corners
   - Close button (X) in top-right corner
   - Centered on screen with subtle shadow

2. **Profile Selector (Role Switcher)**
   - Title: "Escolha seu perfil"
   - Subtitle: "Selecione como deseja acessar a plataforma"
   - Three clickable cards: Aluno, Mentor, Admin
   - Each card has an icon and label
   - Selected card has blue border and background tint
   - Icons: GraduationCap for Aluno, Building/Landmark for Mentor, Shield/CheckCircle for Admin

3. **Dynamic Section Divider**
   - Horizontal line with text "LOGIN DE STUDENT" (changes based on selected role)

4. **Form Inputs with Icons**
   - Email field with envelope icon prefix
   - Password field with lock icon prefix
   - "Esqueceu?" link aligned right on password label

5. **Submit Button**
   - Full-width blue/indigo button
   - Text "Entrar" with arrow icon
   - Rounded corners

6. **Footer**
   - "Não tem uma conta? Cadastre-se grátis" link

---

## Implementation Approach

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Login.tsx` | Rewrite | Complete UI overhaul with new design |
| `src/components/layouts/AuthLayout.tsx` | Update | Simplify to centered modal layout |

---

## Detailed Changes

### 1. Update AuthLayout.tsx

Transform from split-screen layout to centered modal:

```
New Structure:
- Full-screen gray/light background
- Centered white card with max-width ~420px
- Rounded corners (24px)
- Soft shadow
- Close button (X) in top-right
```

**Visual Specifications:**
- Background: `bg-slate-50` or `bg-gray-100`
- Card: `bg-white rounded-[24px] shadow-xl max-w-md w-full mx-auto p-8`
- Close button: Ghost button with X icon, positioned absolute top-right

### 2. Rewrite Login.tsx

**New State Management:**
- Add `selectedRole` state to track which profile is selected (default: 'student')
- Pre-fill email/password based on selected role for dev convenience

**Profile Selector Component:**
```tsx
// Three cards in a row
<div className="grid grid-cols-3 gap-3">
  {/* Aluno Card */}
  <ProfileCard 
    icon={GraduationCap}
    label="Aluno"
    selected={selectedRole === 'student'}
    onClick={() => setSelectedRole('student')}
  />
  {/* Mentor Card */}
  <ProfileCard 
    icon={Building2}
    label="Mentor"
    selected={selectedRole === 'mentor'}
    onClick={() => setSelectedRole('mentor')}
  />
  {/* Admin Card */}
  <ProfileCard 
    icon={ShieldCheck}
    label="Admin"
    selected={selectedRole === 'admin'}
    onClick={() => setSelectedRole('admin')}
  />
</div>
```

**Profile Card Styling:**
- Default: `border border-gray-200 bg-white hover:border-gray-300`
- Selected: `border-2 border-blue-500 bg-blue-50`
- Icon container: Circular, light blue when selected
- Rounded corners: `rounded-xl`

**Section Divider:**
```tsx
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200" />
  </div>
  <div className="relative flex justify-center">
    <span className="bg-white px-4 text-sm text-gray-500 uppercase tracking-wider">
      Login de {roleLabel}
    </span>
  </div>
</div>
```

**Input Fields with Icons:**
```tsx
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
  <Input 
    className="pl-10 rounded-xl border-gray-200 h-12"
    placeholder="aluno@teste.com"
  />
</div>
```

**Submit Button:**
```tsx
<Button 
  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
>
  Entrar
  <ArrowRight className="ml-2 h-4 w-4" />
</Button>
```

---

## Component Structure

```
Login Page
├── Background (slate-50)
└── Card Container (white, rounded-24px)
    ├── Close Button (X, absolute top-right)
    ├── Header
    │   ├── Title: "Escolha seu perfil"
    │   └── Subtitle: "Selecione como deseja acessar a plataforma"
    ├── Profile Selector (3 cards in grid)
    │   ├── Aluno (GraduationCap icon)
    │   ├── Mentor (Building2 icon)
    │   └── Admin (ShieldCheck icon)
    ├── Section Divider ("LOGIN DE {ROLE}")
    ├── Form
    │   ├── Email Input (with Mail icon)
    │   ├── Password Input (with Lock icon + "Esqueceu?" link)
    │   └── Submit Button ("Entrar →")
    └── Footer Link ("Cadastre-se grátis")
```

---

## Visual Specifications

### Colors
- Background: `#f8fafc` (slate-50)
- Card: `#ffffff`
- Primary/Selected: `#4f46e5` (indigo-600)
- Selected background: `#eef2ff` (indigo-50)
- Text primary: `#1f2937` (gray-800)
- Text secondary: `#6b7280` (gray-500)
- Border default: `#e5e7eb` (gray-200)

### Typography
- Title: `text-xl font-semibold text-center`
- Subtitle: `text-sm text-gray-500 text-center`
- Divider text: `text-xs uppercase tracking-wider text-gray-400`
- Input labels: `text-sm font-medium text-gray-700`
- Profile label: `text-sm font-medium`

### Spacing
- Card padding: `p-8`
- Gap between profile cards: `gap-3`
- Section margins: `my-6`
- Form fields gap: `space-y-4`

### Border Radius
- Card: `rounded-[24px]`
- Profile cards: `rounded-xl` (12px)
- Inputs: `rounded-xl`
- Button: `rounded-xl`

---

## Behavior

1. **Role Selection:**
   - Clicking a profile card updates `selectedRole` state
   - Email field auto-fills with test credentials (dev convenience)
   - Divider text updates to show selected role name

2. **Form Submission:**
   - Uses existing `login()` function from AuthContext
   - Shows loading state with spinner
   - Displays toast on success/error

3. **Close Button:**
   - On homepage, navigates to `/`
   - Could be hidden or redirect to landing

---

## Icons Used
- `GraduationCap` - Student profile
- `Building2` or `Landmark` - Mentor profile  
- `ShieldCheck` or `CheckCircle` - Admin profile
- `Mail` - Email input prefix
- `Lock` - Password input prefix
- `X` - Close button
- `ArrowRight` - Submit button suffix

All icons from `lucide-react` (already installed).

---

## Expected Result

After implementation:
1. Clean, modern login interface matching the reference image exactly
2. Interactive profile selector with visual feedback
3. Icon-prefixed inputs for better UX
4. Auto-fill credentials based on selected role (dev convenience)
5. Responsive design that works on mobile and desktop
6. Consistent 24px border-radius premium aesthetic

