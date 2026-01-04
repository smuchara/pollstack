<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProfilePhotoController extends Controller
{
    /**
     * Update the user's profile photo.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'max:1024'],
        ]);

        $request->user()->updateProfilePhoto($request->file('photo'));

        return back()->with('status', 'profile-photo-updated');
    }

    /**
     * Delete the user's profile photo.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->user()->deleteProfilePhoto();

        return back()->with('status', 'profile-photo-deleted');
    }
}
