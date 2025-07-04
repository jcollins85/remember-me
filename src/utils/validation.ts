export interface ValidationErrors {
  name?: string;
  dateMet?: string;
  venue?: string;
  tags?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

/**
 * Validates person form data.
 * @param data Fields to validate: name, dateMet, venue, tags
 */
export function validatePersonForm(data: {
  name: string;
  dateMet: string;
  venue: string;
  tags: string[];
}): ValidationResult {
  const errors: ValidationErrors = {};
  const today = new Date().toISOString().split('T')[0];

  // Name required
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  // Date Met cannot be in future
  if (data.dateMet && data.dateMet > today) {
    errors.dateMet = 'Date Met cannot be in the future';
  }

  // Venue length limit
  if (data.venue.length > 50) {
    errors.venue = 'Venue name must be 50 characters or fewer';
  }

  // Tags count limit
  if (data.tags.length > 15) {
    errors.tags = 'Maximum of 15 tags allowed';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
