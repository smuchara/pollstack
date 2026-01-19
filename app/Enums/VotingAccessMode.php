<?php

namespace App\Enums;

enum VotingAccessMode: string
{
    case RemoteOnly = 'remote_only';
    case OnPremiseOnly = 'on_premise_only';
    case Hybrid = 'hybrid';

    /**
     * Get the human-readable label for the mode.
     */
    public function label(): string
    {
        return match ($this) {
            self::RemoteOnly => 'Remote Only',
            self::OnPremiseOnly => 'On-Premise Only',
            self::Hybrid => 'Hybrid',
        };
    }

    /**
     * Get the description for the mode.
     */
    public function description(): string
    {
        return match ($this) {
            self::RemoteOnly => 'Fully online participation, no verification required',
            self::OnPremiseOnly => 'Users must verify physical presence via QR code before voting',
            self::Hybrid => 'Users may vote remotely or verify on-premise via QR code',
        };
    }

    /**
     * Get the default voting access mode.
     */
    public static function default(): self
    {
        return self::Hybrid;
    }

    /**
     * Check if this mode requires on-premise verification.
     */
    public function requiresOnPremiseVerification(): bool
    {
        return $this === self::OnPremiseOnly;
    }

    /**
     * Check if this mode supports remote voting.
     */
    public function supportsRemoteVoting(): bool
    {
        return $this !== self::OnPremiseOnly;
    }

    /**
     * Check if this mode supports on-premise verification.
     */
    public function supportsOnPremiseVerification(): bool
    {
        return $this !== self::RemoteOnly;
    }

    /**
     * Get all mode values.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
