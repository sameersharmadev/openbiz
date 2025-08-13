export const validateAadhaar = (aadhaar: string): boolean => {
  if (!aadhaar || typeof aadhaar !== 'string') {
    return false;
  }
  const cleanAadhaar = aadhaar.replace(/\s+/g, '');
  return /^[0-9]{12}$/.test(cleanAadhaar);
};

export const validatePAN = (pan: string): boolean => {
  if (!pan || typeof pan !== 'string') {
    return false;
  }
  const cleanPAN = pan.toUpperCase().replace(/\s+/g, '');
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPAN);
};

export const validateEntrepreneurName = (name: string): boolean => {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 100;
};

export const validateMobile = (mobile: string): boolean => {
  if (!mobile || typeof mobile !== 'string') {
    return false;
  }
  const cleanMobile = mobile.replace(/\s+/g, '');
  return /^[0-9]{10}$/.test(cleanMobile);
};

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};