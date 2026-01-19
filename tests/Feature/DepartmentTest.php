<?php

use App\Models\Department;
use App\Models\Organization;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

describe('Department Model', function () {
    it('auto-creates default departments when organization is created', function () {
        $organization = Organization::factory()->create();

        // Should have all default departments
        expect($organization->departments()->count())->toBe(count(Department::DEFAULT_DEPARTMENTS));

        // All should be marked as default
        expect($organization->departments()->where('is_default', true)->count())
            ->toBe(count(Department::DEFAULT_DEPARTMENTS));
    });

    it('creates department with correct attributes', function () {
        $organization = Organization::factory()->create();

        $department = $organization->departments()->first();

        expect($department->name)->not->toBeEmpty()
            ->and($department->slug)->not->toBeEmpty()
            ->and($department->organization_id)->toBe($organization->id)
            ->and($department->is_default)->toBeTrue();
    });

    it('auto-generates slug from name', function () {
        $organization = Organization::factory()->create();

        $department = Department::create([
            'name' => 'Custom Department Name',
            'organization_id' => $organization->id,
        ]);

        expect($department->slug)->toBe('custom-department-name');
    });

    it('enforces unique slugs within organization', function () {
        $organization = Organization::factory()->create();

        Department::create([
            'name' => 'Test Dept',
            'slug' => 'test-dept',
            'organization_id' => $organization->id,
        ]);

        // Trying to create another with same slug should fail
        expect(fn () => Department::create([
            'name' => 'Test Dept',
            'slug' => 'test-dept',
            'organization_id' => $organization->id,
        ]))->toThrow(\Illuminate\Database\QueryException::class);
    });

    it('allows same slug in different organizations', function () {
        $org1 = Organization::factory()->create();
        $org2 = Organization::factory()->create();

        $dept1 = Department::create([
            'name' => 'Unique Dept',
            'slug' => 'unique-dept',
            'organization_id' => $org1->id,
        ]);

        $dept2 = Department::create([
            'name' => 'Unique Dept',
            'slug' => 'unique-dept',
            'organization_id' => $org2->id,
        ]);

        expect($dept1->id)->not->toBe($dept2->id)
            ->and($dept1->slug)->toBe($dept2->slug);
    });
});

describe('User Department Relationship', function () {
    it('allows user to belong to multiple departments', function () {
        $organization = Organization::factory()->create();
        $user = User::factory()->create(['organization_id' => $organization->id]);

        $departments = $organization->departments()->take(3)->get();

        $user->departments()->attach($departments->pluck('id'));

        expect($user->departments()->count())->toBe(3);
    });

    it('checks if user belongs to a department', function () {
        $organization = Organization::factory()->create();
        $user = User::factory()->create(['organization_id' => $organization->id]);

        $department = $organization->departments()->first();
        $otherDepartment = $organization->departments()->skip(1)->first();

        $user->departments()->attach($department->id);

        expect($user->belongsToDepartment($department))->toBeTrue()
            ->and($user->belongsToDepartment($otherDepartment))->toBeFalse();
    });

    it('checks if user belongs to any of given departments', function () {
        $organization = Organization::factory()->create();
        $user = User::factory()->create(['organization_id' => $organization->id]);

        $departments = $organization->departments()->take(2)->get();
        $otherDepartments = $organization->departments()->skip(2)->take(2)->get();

        $user->departments()->attach($departments->first()->id);

        expect($user->belongsToAnyDepartment($departments->pluck('id')->toArray()))->toBeTrue()
            ->and($user->belongsToAnyDepartment($otherDepartments->pluck('id')->toArray()))->toBeFalse();
    });
});

describe('Department Scopes', function () {
    it('scopes to default departments', function () {
        $organization = Organization::factory()->create();

        // All auto-created should be default
        expect(Department::default()->forOrganization($organization->id)->count())
            ->toBe(count(Department::DEFAULT_DEPARTMENTS));
    });

    it('scopes to custom departments', function () {
        $organization = Organization::factory()->create();

        Department::create([
            'name' => 'Custom Team',
            'organization_id' => $organization->id,
            'is_default' => false,
        ]);

        expect(Department::custom()->forOrganization($organization->id)->count())->toBe(1);
    });

    it('scopes to organization', function () {
        $org1 = Organization::factory()->create();
        $org2 = Organization::factory()->create();

        $org1Count = Department::forOrganization($org1->id)->count();
        $org2Count = Department::forOrganization($org2->id)->count();

        // Both should have default departments
        expect($org1Count)->toBe(count(Department::DEFAULT_DEPARTMENTS))
            ->and($org2Count)->toBe(count(Department::DEFAULT_DEPARTMENTS));
    });
});
