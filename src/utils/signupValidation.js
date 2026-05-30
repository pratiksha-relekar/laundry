const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value || '').trim())
}

/** Returns an object of field keys → error messages (empty object = valid). */
export function validateSignupFields({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
}) {
  const errors = {}
  const first = (firstName || '').trim()
  const last = (lastName || '').trim()
  const mail = (email || '').trim()

  if (!first) errors.firstName = 'Please enter your first name.'
  if (!last) errors.lastName = 'Please enter your last name.'
  if (!mail) errors.email = 'Please enter your email.'
  else if (!isValidEmail(mail)) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Please enter a password.'
  else if (password.length < 6)
    errors.password = 'Password must be at least 6 characters.'
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.'
  else if (password && password !== confirmPassword)
    errors.confirmPassword = 'Passwords do not match.'

  return errors
}

export function fullNameFromParts(firstName, lastName) {
  return [firstName, lastName]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' ')
}
