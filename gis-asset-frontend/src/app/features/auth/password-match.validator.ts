import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * FormGroup-level validator (not a single-control one, since it needs to
 * compare two sibling controls). The backend re-checks this same
 * condition independently — this is purely for fast UI feedback.
 */
export function passwordsMatchValidator(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirmPassword = group.get(confirmKey)?.value;

    if (!password || !confirmPassword) {
      return null; // let `required` validators on the individual controls handle emptiness
    }

    return password === confirmPassword ? null : { passwordsMismatch: true };
  };
}
