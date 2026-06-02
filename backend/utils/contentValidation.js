const isBlank = (value) => !value || String(value).trim() === "";

const validateRequired = (value, fieldName) => {
  if (isBlank(value)) return `${fieldName} is required`;
  return null;
};

const validateFutureDate = (value) => {
  if (isBlank(value)) return "Date is required";

  const selectedDate = new Date(value);
  if (Number.isNaN(selectedDate.getTime())) return "Date is invalid";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate < today) return "Date must be today or in the future";
  return null;
};

export const validateEventData = (event = {}) => {
  const errors = {};

  const title = validateRequired(event.title, "Title");
  if (title) errors.title = title;

  const location = validateRequired(event.location, "Location");
  if (location) errors.location = location;

  const date = validateFutureDate(event.date);
  if (date) errors.date = date;

  const time = validateRequired(event.time, "Time");
  if (time) errors.time = time;

  const type = validateRequired(event.type, "Type");
  if (type) errors.type = type;

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateAnnouncementData = (announcement = {}) => {
  const errors = {};

  const title = validateRequired(announcement.title, "Title");
  if (title) errors.title = title;

  const date = validateFutureDate(announcement.date);
  if (date) errors.date = date;

  const priority = validateRequired(announcement.priority, "Priority");
  if (priority) errors.priority = priority;
  else if (!["normal", "high"].includes(String(announcement.priority))) {
    errors.priority = "Priority must be normal or high";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
