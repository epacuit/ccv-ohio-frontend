import React from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

/**
 * PollDateTimePicker Component
 * 
 * Ensures both `value` and `minDateTime` are Dayjs instances
 * so that AdapterDayjs.isValid(...) will always see a valid Dayjs.
 */
const PollDateTimePicker = ({
  value,
  onChange,
  disabled = false,
  label = "Closing Date & Time (Optional)",
  helperText = "Leave empty for no deadline",
  // Default to "now" as a Dayjs object, not a JS Date
  minDateTime = dayjs(),
  fullWidth = true,
  onClear,
}) => {
  // Convert the incoming value to Dayjs (or null)
  let safeValue = null;
  if (value) {
    if (dayjs.isDayjs(value)) {
      safeValue = value.isValid() ? value : null;
    } else {
      const parsed = dayjs(value);
      safeValue = parsed.isValid() ? parsed : null;
    }
  }

  // **New**: ensure minDateTime is also a Dayjs
  const safeMinDateTime = dayjs.isDayjs(minDateTime)
    ? minDateTime
    : dayjs(minDateTime);

  const handleChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
    if (!newValue && onClear) {
      onClear();
    }
  };

  return (
    <DateTimePicker
      label={label}
      value={safeValue}
      onChange={handleChange}
      disabled={disabled}
      // Pass the Dayjs version
      minDateTime={safeMinDateTime}
      sx={{ width: fullWidth ? '100%' : 'auto' }}
      slotProps={{
        textField: {
          fullWidth,
          helperText,
        },
        actionBar: {
          actions: ['clear', 'accept'],
        },
      }}
    />
  );
};

export default PollDateTimePicker;
