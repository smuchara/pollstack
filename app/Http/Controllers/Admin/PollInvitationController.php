<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InviteDepartmentsToPollRequest;
use App\Http\Requests\Admin\InviteUsersToPollRequest;
use App\Mail\PollInvitation;
use App\Models\Department;
use App\Models\Poll;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class PollInvitationController extends Controller
{
    /**
     * Get available users for invitation (users in the same organization).
     */
    public function availableUsers(Poll $poll)
    {
        $organization = app('organization');

        // Ensure poll belongs to this organization
        if ($poll->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to poll.');
        }

        // Get all users in the organization, excluding already invited users
        $invitedUserIds = $poll->invitedUsers()->pluck('users.id');

        $users = User::where('organization_id', $organization->id)
            ->whereNotIn('id', $invitedUserIds)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Get available departments for invitation (departments in the same organization).
     */
    public function availableDepartments(Poll $poll)
    {
        $organization = app('organization');

        // Ensure poll belongs to this organization
        if ($poll->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to poll.');
        }

        // Get all departments in the organization, indicating which are already invited
        $invitedDeptIds = $poll->invitedDepartments()->pluck('departments.id')->toArray();

        $departments = Department::where('organization_id', $organization->id)
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(function ($dept) use ($invitedDeptIds) {
                return [
                    'id' => $dept->id,
                    'name' => $dept->name,
                    'slug' => $dept->slug,
                    'description' => $dept->description,
                    'is_default' => $dept->is_default,
                    'users_count' => $dept->users_count,
                    'is_invited' => in_array($dept->id, $invitedDeptIds),
                ];
            });

        return response()->json([
            'departments' => $departments,
        ]);
    }

    /**
     * Invite individual users to a poll.
     */
    public function inviteUsers(InviteUsersToPollRequest $request, Poll $poll)
    {
        $organization = app('organization');

        // Ensure poll belongs to this organization
        if ($poll->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to poll.');
        }

        // Validate that users belong to the same organization
        $userIds = $request->validated('user_ids');
        $validUserIds = User::whereIn('id', $userIds)
            ->where('organization_id', $organization->id)
            ->pluck('id')
            ->toArray();

        if (count($validUserIds) !== count($userIds)) {
            return back()->with('error', 'Some users do not belong to your organization.');
        }

        // Invite users and get changes
        $changes = $poll->inviteUsers($validUserIds, $request->user()->id);

        // Send email notifications to newly invited users
        $newlyInvitedIds = $changes['attached'];

        if (!empty($newlyInvitedIds)) {
            $usersToInvite = User::whereIn('id', $newlyInvitedIds)->get();
            foreach ($usersToInvite as $user) {
                Mail::to($user)->queue(new PollInvitation($poll, $user));
            }
        }

        $count = count($validUserIds);

        return back()->with('success', "{$count} user(s) invited successfully.");
    }

    /**
     * QuickInvite™ - Invite entire departments to a poll.
     */
    public function inviteDepartments(InviteDepartmentsToPollRequest $request, Poll $poll)
    {
        $organization = app('organization');

        // Ensure poll belongs to this organization
        if ($poll->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to poll.');
        }

        // Validate that departments belong to the same organization
        $departmentIds = $request->validated('department_ids');
        $validDeptIds = Department::whereIn('id', $departmentIds)
            ->where('organization_id', $organization->id)
            ->pluck('id')
            ->toArray();

        if (count($validDeptIds) !== count($departmentIds)) {
            return back()->with('error', 'Some departments do not belong to your organization.');
        }

        // Invite departments and get changes
        $changes = $poll->inviteDepartments($validDeptIds, $request->user()->id);

        // Send email notifications to users in newly invited departments
        $newlyInvitedDeptIds = $changes['attached'];

        if (!empty($newlyInvitedDeptIds)) {
            $usersInDepts = User::whereHas('departments', function ($query) use ($newlyInvitedDeptIds) {
                $query->whereIn('departments.id', $newlyInvitedDeptIds);
            })->get();

            foreach ($usersInDepts as $user) {
                Mail::to($user)->queue(new PollInvitation($poll, $user));
            }
        }

        // Get count of users who will be invited via departments
        $userCount = User::whereHas('departments', function ($query) use ($validDeptIds) {
            $query->whereIn('departments.id', $validDeptIds);
        })->count();

        $deptCount = count($validDeptIds);

        return back()->with('success', "{$deptCount} department(s) invited ({$userCount} users) successfully.");
    }

    /**
     * Remove user invitation from a poll.
     */
    public function revokeUserInvitation(Request $request, Poll $poll, User $user)
    {
        $organization = app('organization');

        // Ensure poll belongs to this organization
        if ($poll->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to poll.');
        }

        $poll->revokeUserInvitations([$user->id]);

        return back()->with('success', 'User invitation revoked successfully.');
    }

    /**
     * Remove department invitation from a poll.
     */
    public function revokeDepartmentInvitation(Request $request, Poll $poll, Department $department)
    {
        $organization = app('organization');

        // Ensure poll belongs to this organization
        if ($poll->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to poll.');
        }

        $poll->revokeDepartmentInvitations([$department->id]);

        return back()->with('success', 'Department invitation revoked successfully.');
    }

    /**
     * Get all current invitations for a poll.
     */
    public function getInvitations(Poll $poll)
    {
        $organization = app('organization');

        // Ensure poll belongs to this organization
        if ($poll->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to poll.');
        }

        $invitedUsers = $poll->invitedUsers()
            ->select('users.id', 'users.name', 'users.email')
            ->withPivot('invited_at', 'invited_by')
            ->get();

        $invitedDepartments = $poll->invitedDepartments()
            ->select('departments.id', 'departments.name', 'departments.slug')
            ->withPivot('invited_at', 'invited_by')
            ->withCount('users')
            ->get();

        return response()->json([
            'invitedUsers' => $invitedUsers,
            'invitedDepartments' => $invitedDepartments,
            'totalInvitedUsers' => $poll->getAllInvitedUsers()->count(),
        ]);
    }
}
