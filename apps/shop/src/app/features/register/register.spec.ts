import { FormControl, FormGroup } from '@angular/forms';
import { passwordsMatchValidator } from './register';

describe('passwordsMatchValidator', () => {
  it('accepts matching passwords and rejects different values', () => {
    const form = new FormGroup(
      {
        password: new FormControl('sparkle123'),
        password_confirmation: new FormControl('sparkle123'),
      },
      { validators: passwordsMatchValidator },
    );

    expect(form.valid).toBe(true);

    form.controls.password_confirmation.setValue('different');

    expect(form.hasError('passwordsMismatch')).toBe(true);
  });
});
