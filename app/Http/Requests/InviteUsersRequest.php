<?php

namespace App\Http\Requests;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InviteUsersRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admins and super admins can invite users
        return $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'emails' => ['required', 'array', 'min:1', 'max:50'],
            'emails.*' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
                function ($attribute, $value, $fail) {
                    // Check for pending invitations with the same email
                    $exists = \App\Models\UserInvitation::where('email', $value)
                        ->whereNull('accepted_at')
                        ->where('expires_at', '>', now())
                        ->exists();
                    
                    if ($exists) {
                        $fail('This email already has a pending invitation.');
                    }
                },
            ],
            'role' => ['nullable', 'string', Rule::in(Role::values())],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'emails.required' => 'At least one email address is required.',
            'emails.array' => 'Emails must be provided as an array.',
            'emails.min' => 'At least one email address is required.',
            'emails.max' => 'You can invite a maximum of 50 users at once.',
            'emails.*.required' => 'Each email address is required.',
            'emails.*.email' => 'Each email must be a valid email address.',
            'emails.*.unique' => 'One or more email addresses already exist in the system or have pending invitations.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'emails.*' => 'email address',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Set default role to 'user' if not provided
        if (!$this->has('role')) {
            $this->merge(['role' => Role::USER->value]);
        }
    }
}
