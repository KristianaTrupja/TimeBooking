/**
 * Formats an employee name for display in compact views (e.g., mobile calendar)
 * Takes the first character of the first name and the full last name
 * 
 * @param fullName - The full name of the employee (e.g., "Elson Gasa")
 * @returns Formatted name (e.g., "EGasa")
 * 
 * @example
 * formatEmployeeName("Elson Gasa") // Returns "EGasa"
 * formatEmployeeName("John Doe") // Returns "JDoe"
 * formatEmployeeName("Mary Jane Smith") // Returns "MSmith" (takes first and last)
 */
export function formatEmployeeName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return fullName || '';
  }

  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 0) {
    return fullName;
  }
  
  if (nameParts.length === 1) {
    // If only one name part, return first character + rest
    return fullName.length > 1 ? fullName.charAt(0).toUpperCase() + fullName.slice(1) : fullName;
  }
  
  // Take first character of first name and full last name
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  
  return firstName.charAt(0).toUpperCase() + lastName;
}
