import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { first } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { faUser, faCheck, faKey } from '@fortawesome/free-solid-svg-icons';

@Component({ templateUrl: 'register.component.html' })
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  // fontawesome icons
  faUser = faUser;
  faCheck = faCheck;
  faKey = faKey;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.form = new FormGroup(
      {
        username: new FormControl('', [Validators.required]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
        ]),
        passwordConfirm: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
        ]),
      },
      this.passwordMatchValidator
    );
  }

  passwordMatchValidator(g: AbstractControl) {
    return g.get('password')!.value === g.get('passwordConfirm')!.value
      ? null
      : { passwordMismatch: true };
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.form.controls;
  }

  // convenience getter for easy access to form group
  get g() {
    return this.form;
  }

  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }
    this.loading = true;

    // need to pass username/password to register()
    // where are they in this.form?
    const { username, password } = this.form.value;

    this.apiService
      .register(username, password)
      .pipe(first())
      .subscribe(
        (data) => {
          this.router.navigate(['/']);
        },
        (error) => {
          // TODO display error
          this.error = error;
          this.loading = false;
        }
      );
  }
}
