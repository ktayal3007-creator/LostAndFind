# User Profile - Quick Reference

## 🎯 For Users

### How to View Your Profile

1. **Navigate to Profile** → Click your profile icon or go to `/profile`
2. **View Information** → See your name, username, email, and phone
3. **Check Account Info** → See when your account was created and last updated

### How to Edit Your Profile

1. **Click "Edit Profile"** → Button in top right of profile card
2. **Modify Fields** → Update your information:
   - Full Name (required)
   - Username (optional, must be unique)
   - Phone Number (optional)
3. **Save Changes** → Click "Save Changes" button
4. **Cancel** → Click "Cancel" to discard changes

### Field Requirements

**Full Name**:
- ✅ Required
- ✅ 2-100 characters

**Username**:
- ✅ Optional
- ✅ 3-30 characters
- ✅ Letters, numbers, underscores only
- ✅ Must be unique

**Email**:
- ❌ Cannot be changed
- ✅ Always visible

**Phone**:
- ✅ Optional
- ✅ Valid phone format

### First-Time Users

When you log in for the first time:
1. Profile is created automatically
2. Welcome message appears
3. You're prompted to complete your profile
4. Fill in your information
5. Click "Save Changes" to continue

---

## 💻 For Developers

### Database Schema

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### TypeScript Interface

```typescript
interface Profile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
```

### API Functions

```typescript
// Update profile
const { error } = await updateProfile({
  full_name: 'John Doe',
  username: 'johndoe123',
  phone: '+1 (555) 123-4567'
});

// Check username availability
const isAvailable = await checkUsernameAvailability('johndoe123');
```

### Component Usage

```tsx
import ProfilePage from '@/pages/ProfilePage';

// Route
<Route path="/profile" element={<ProfilePage />} />
```

### State Management

```typescript
// Component state
const [isEditing, setIsEditing] = useState(false);
const [saving, setSaving] = useState(false);
const [loading, setLoading] = useState(true);

// Form state (React Hook Form + Zod)
const form = useForm<ProfileFormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { full_name: '', username: '', phone: '' }
});
```

### Validation Schema

```typescript
const formSchema = z.object({
  full_name: z.string().min(2).max(100),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  phone: z.string().regex(/^[0-9+\-\s()]*$/).optional()
});
```

### RLS Policies

```sql
-- View own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Update own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

## 🔧 Key Features

### View Mode
- ✅ Display all profile information
- ✅ Disabled input fields
- ✅ "Edit Profile" button
- ✅ Account creation/update dates

### Edit Mode
- ✅ Editable input fields (except email)
- ✅ Real-time validation
- ✅ Username availability check
- ✅ "Save Changes" and "Cancel" buttons
- ✅ Loading states

### First-Time User
- ✅ Automatic profile creation
- ✅ Welcome alert
- ✅ Guided completion
- ✅ Cannot cancel (must complete)

### Security
- ✅ RLS policies enforce user isolation
- ✅ Email is read-only
- ✅ Username uniqueness enforced
- ✅ Client and server validation

---

## 🐛 Common Issues

### Username Already Taken
**Error**: "This username is already taken"
**Solution**: Choose a different username

### Profile Not Loading
**Cause**: Not logged in or network error
**Solution**: Verify login status and network connection

### Save Not Working
**Cause**: Validation errors or network issue
**Solution**: Check form validation and network connection

### First-Time Profile Not Created
**Cause**: RLS policy or database error
**Solution**: Check RLS policies and error logs

---

## 📊 File Structure

```
src/
├── pages/
│   └── ProfilePage.tsx          # Main profile page component
├── contexts/
│   └── AuthContext.tsx          # Auth context with updateProfile()
├── types/
│   └── types.ts                 # Profile interface
└── db/
    └── supabase.ts              # Supabase client

supabase/
└── migrations/
    └── 00012_add_username_to_profiles.sql  # Database migration
```

---

## ✅ Testing Checklist

- [x] View mode displays correctly
- [x] Edit mode enables fields
- [x] Save updates database
- [x] Cancel reverts changes
- [x] First-time user flow works
- [x] Username uniqueness enforced
- [x] Email is read-only
- [x] Validation works
- [x] Loading states show
- [x] Error handling works
- [x] Mobile responsive
- [x] RLS policies enforced

---

**Status**: ✅ Complete & Tested
**Version**: 6.0
**Last Updated**: 2025-12-21
