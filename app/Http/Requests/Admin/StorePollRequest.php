<?php

namespace App\Http\Requests\Admin;

use App\Models\Poll;
use Illuminate\Foundation\Http\FormRequest;

class StorePollRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'question' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:open,closed'],
            'poll_type' => ['sometimes', 'string', 'in:standard,profile'],
            'visibility' => ['required', 'string', 'in:public,invite_only'],
            'status' => ['required', 'string', 'in:scheduled,active,ended,archived'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'options' => ['required', 'array', 'min:2'],

            // Standard poll options
            'options.*.text' => ['required', 'string', 'max:255'],

            // Optional: invite users/departments immediately when creating an invite-only poll
            'invite_user_ids' => ['nullable', 'array'],
            'invite_user_ids.*' => ['integer', 'exists:users,id'],
            'invite_department_ids' => ['nullable', 'array'],
            'invite_department_ids.*' => ['integer', 'exists:departments,id'],
            'invite_users_list' => ['nullable', 'array'],
            'invite_users_list.*.email' => ['required', 'email'],
        ];

        // Add profile poll validation rules when poll_type is 'profile'
        if ($this->input('poll_type') === Poll::POLL_TYPE_PROFILE) {
            $rules['options.*.name'] = ['required', 'string', 'max:255'];
            $rules['options.*.position'] = ['required', 'string', 'max:255'];
            $rules['options.*.image'] = ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'options.*.text.required' => 'Each option must have a text value.',
            'options.*.name.required' => 'Each candidate must have a name.',
            'options.*.position.required' => 'Each candidate must have a position.',
            'options.*.image.image' => 'The uploaded file must be an image.',
            'options.*.image.mimes' => 'The image must be a JPEG, PNG, or WebP file.',
            'options.*.image.max' => 'The image may not be greater than 2MB.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Default poll_type to 'standard' if not provided
        if (!$this->has('poll_type')) {
            $this->merge([
                'poll_type' => Poll::POLL_TYPE_STANDARD,
            ]);
        }
    }
}
