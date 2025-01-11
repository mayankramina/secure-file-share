export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and special characters
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/[&]/g, '&amp;') // Encode ampersands
    .trim(); // Remove leading/trailing whitespace
}; 