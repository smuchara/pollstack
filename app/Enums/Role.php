<?php

namespace App\Enums;

enum Role: string
{
    case SUPER_ADMIN = 'super_admin';
    case CLIENT_SUPER_ADMIN = 'client_super_admin';
    case ADMIN = 'admin';
    case USER = 'user';

    /**
     * Get the label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Super Admin',
            self::CLIENT_SUPER_ADMIN => 'Client Super Admin',
            self::ADMIN => 'Admin',
            self::USER => 'User',
        };
    }

    /**
     * Get all role values.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Check if this role has higher or equal privilege than another role.
     */
    public function hasPrivilegeOf(Role $role): bool
    {
        $hierarchy = [
            self::USER->value => 1,
            self::ADMIN->value => 2,
            self::CLIENT_SUPER_ADMIN->value => 3,
            self::SUPER_ADMIN->value => 4,
        ];

        return $hierarchy[$this->value] >= $hierarchy[$role->value];
    }

    /**
     * Check if this is a super admin role.
     */
    public function isSuperAdmin(): bool
    {
        return $this === self::SUPER_ADMIN;
    }

    /**
     * Check if this is an admin role (including super admin).
     */
    public function isAdmin(): bool
    {
        return $this === self::ADMIN || $this === self::SUPER_ADMIN || $this === self::CLIENT_SUPER_ADMIN;
    }

    /**
     * Check if this is a regular user role.
     */
    public function isUser(): bool
    {
        return $this === self::USER;
    }
}
