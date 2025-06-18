export function formatDateToFrench(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();

  return `${day}/${month}/${year}`;
}

export function parseFrenchDate(dateStr: string): Date {
  // Expected format: DD/MM/YYYY
  const [day, month, year] = dateStr
    .split("/")
    .map((part) => parseInt(part, 10));
  if (!day || !month || !year) {
    // Fall back or throw an error
    throw new Error("Invalid French date format. Expected DD/MM/YYYY.");
  }
  return new Date(year, month - 1, day);
}

// Helper to convert Date to YYYY-MM-DD for the <input type="date">
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatToInputDate(date: Date): string {
  return date.toISOString().split("T")[0];
}


export function formatDateToFrenchWithTime(date: string): string {
  const dateObj = new Date(date);
  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear().toString();
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}