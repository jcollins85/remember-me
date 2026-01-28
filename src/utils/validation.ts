export interface ValidationErrors {
  name?: string;
  dateMet?: string;
  venue?: string;
  tags?: string;
  position?: string;
  description?: string;
  coords?: string;
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
  position?: string;
  description?: string;
  latitude?: string;
  longitude?: string;
}): ValidationResult {
  const errors: ValidationErrors = {};
  const today = new Date().toISOString().split('T')[0];
  const trimmedName = data.name.trim();

  // Name required
  if (!trimmedName) {
    errors.name = 'Name is required';
  } else if (trimmedName.length > 60) {
    errors.name = 'Name must be 60 characters or fewer';
  }

  // Date Met cannot be in future
  if (!data.dateMet) {
    errors.dateMet = 'Date Met is required';
  } else if (data.dateMet > today) {
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

  const trimmedPosition = data.position?.trim();
  if (trimmedPosition && trimmedPosition.length > 60) {
    errors.position = 'Position must be 60 characters or fewer';
  }

  const trimmedDescription = data.description?.trim();
  if (trimmedDescription && trimmedDescription.length > 500) {
    errors.description = 'Description must be 500 characters or fewer';
  }

  const latInput = data.latitude?.trim();
  const lonInput = data.longitude?.trim();
  if (latInput || lonInput) {
    const lat = latInput ? parseFloat(latInput) : NaN;
    const lon = lonInput ? parseFloat(lonInput) : NaN;
    if (
      !latInput ||
      !lonInput ||
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      errors.coords = 'Enter valid latitude (-90 to 90) and longitude (-180 to 180)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
