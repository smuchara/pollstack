<?php

namespace App\Enums;

enum VerificationType: string
{
    case Remote = 'remote';
    case OnPremise = 'on_premise';

    /**
     * Get the human-readable label for the verification type.
     */
    public function label(): string
    {
        return match ($this) {
            self::Remote => 'Remote',
            self::OnPremise => 'On-Premise',
        };
    }

    /**
     * Get the description for the verification type.
     */
    public function description(): string
    {
        return match ($this) {
            self::Remote => 'Voted remotely without physical presence verification',
            self::OnPremise => 'Voted after verifying physical presence via QR code',
        };
    }

    /**
     * Get all verification type values.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
