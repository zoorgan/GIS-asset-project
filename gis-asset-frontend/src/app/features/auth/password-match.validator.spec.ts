import { FormControl, FormGroup } from '@angular/forms';
import { passwordsMatchValidator } from './password-match.validator';

describe('passwordsMatchValidator', () => {
  it('should return null when passwords match', () => {
    const form = new FormGroup(
      {
        password: new FormControl('Secret123'),
        confirmPassword: new FormControl('Secret123'),
      },
      { validators: passwordsMatchValidator('password', 'confirmPassword') }
    );

    expect(form.errors).toBeNull();
  });

  it('should return { passwordsMismatch: true } when passwords do not match', () => {
    const form = new FormGroup(
      {
        password: new FormControl('Secret123'),
        confirmPassword: new FormControl('Different123'),
      },
      { validators: passwordsMatchValidator('password', 'confirmPassword') }
    );

    expect(form.errors).toEqual({ passwordsMismatch: true });
  });

  it('should return null when one or both fields are empty', () => {
    const form = new FormGroup(
      {
        password: new FormControl(''),
        confirmPassword: new FormControl(''),
      },
      { validators: passwordsMatchValidator('password', 'confirmPassword') }
    );

    expect(form.errors).toBeNull();
  });
});
