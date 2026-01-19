<?php

namespace App\Enums;

enum NotificationType: string
{
    case PollInvitation = 'poll_invitation';
    case ProxyVoterAssigned = 'proxy_voter_assigned';
    case PollStartingSoon = 'poll_starting_soon';
    case PollEndingSoon = 'poll_ending_soon';
    case PollResults = 'poll_results';
    case InvitationFailed = 'invitation_failed';
    case SystemUpdate = 'system_update';
    case UserRegistered = 'user_registered';
    case BulkInviteCompleted = 'bulk_invite_completed';
    case AccountLinked = 'account_linked';
    case WelcomeNewUser = 'welcome_new_user';
    case VoteCast = 'vote_cast';

    /**
     * Get the human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::PollInvitation => 'Poll Invitation',
            self::ProxyVoterAssigned => 'Proxy Voter Assignment',
            self::PollStartingSoon => 'Poll Starting Soon',
            self::PollEndingSoon => 'Poll Ending Soon',
            self::PollResults => 'Poll Results',
            self::InvitationFailed => 'Invitation Failed',
            self::SystemUpdate => 'System Update',
            self::UserRegistered => 'User Registered',
            self::BulkInviteCompleted => 'Bulk Invite Completed',
            self::AccountLinked => 'Account Linked',
            self::WelcomeNewUser => 'New User Joined',
            self::VoteCast => 'Vote Recorded',
        };
    }

    /**
     * Get the icon name for this notification type.
     */
    public function icon(): string
    {
        return match ($this) {
            self::PollInvitation => 'vote',
            self::ProxyVoterAssigned => 'user-check',
            self::PollStartingSoon => 'clock',
            self::PollEndingSoon => 'alarm-clock',
            self::PollResults => 'bar-chart',
            self::InvitationFailed => 'x-circle',
            self::SystemUpdate => 'info',
            self::UserRegistered => 'user-plus',
            self::BulkInviteCompleted => 'check-circle',
            self::AccountLinked => 'link',
            self::WelcomeNewUser => 'user-check',
            self::VoteCast => 'check',
        };
    }

    /**
     * Get the color theme for this notification type.
     */
    public function color(): string
    {
        return match ($this) {
            self::PollInvitation => 'blue',
            self::ProxyVoterAssigned => 'purple',
            self::PollStartingSoon => 'amber',
            self::PollEndingSoon => 'orange',
            self::PollResults => 'green',
            self::InvitationFailed => 'red',
            self::SystemUpdate => 'slate',
            self::UserRegistered => 'emerald',
            self::BulkInviteCompleted => 'green',
            self::AccountLinked => 'blue',
            self::WelcomeNewUser => 'emerald',
            self::VoteCast => 'green',
        };
    }
}
