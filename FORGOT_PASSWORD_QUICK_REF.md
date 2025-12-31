# Forgot Password - Quick Reference

## 🔐 For Users

### How to Reset Your Password

1. **Go to Login Page** → Click "Forgot password?"
2. **Enter Your Email** → Use your registered college email
3. **Check Your Email** → Look for reset link (check spam too!)
4. **Click Reset Link** → Opens reset password page
5. **Enter New Password** → Must meet requirements:
   - At least 8 characters
   - 1 uppercase letter
   - 1 number
   - 1 special character
6. **Confirm Password** → Enter same password again
7. **Click "Reset Password"** → Done! Redirects to login
8. **Sign In** → Use your new password

### Troubleshooting

**Not receiving email?**
- Check spam/junk folder
- Wait a few minutes
- Try again with correct email

**Link not working?**
- Link expires after 1 hour
- Request a new link
- Use the most recent email

**Password not updating?**
- Check password requirements
- Make sure passwords match
- Try again

---

## 💻 For Developers

### API Functions

```typescript
// Request password reset
const { error } = await requestPasswordReset(email);

// Reset password
const { error } = await resetPassword(newPassword);
```

### Routes

- `/forgot-password` - Request reset page
- `/reset-password` - Reset password page (requires token)

### Password Requirements

```typescript
- length >= 8
- /[A-Z]/.test(password)  // Uppercase
- /[0-9]/.test(password)  // Number
- /[!@#$%^&*(),.?":{}|<>]/.test(password)  // Special char
```

### Security Features

✅ Token expires in 1 hour
✅ Single-use tokens
✅ All sessions invalidated on reset
✅ Generic error messages (no email enumeration)
✅ Rate limiting (Supabase built-in)
✅ College email validation

---

## 🎯 Key Features

- ✅ Email-based password reset
- ✅ Secure OTP via Supabase Auth
- ✅ Real-time password strength indicator
- ✅ Password visibility toggle
- ✅ Auto-redirect after success
- ✅ Mobile responsive
- ✅ Accessible UI
- ✅ Production-ready

---

**Status**: ✅ Complete & Tested
**Version**: 5.0
**Last Updated**: 2025-12-21
