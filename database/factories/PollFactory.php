<?php

namespace Database\Factories;

use App\Models\Poll;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Poll>
 */
class PollFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'question' => $this->faker->sentence() . '?',
            'description' => $this->faker->optional()->paragraph(),
            'type' => $this->faker->randomElement(['open', 'closed']),
            'poll_type' => Poll::POLL_TYPE_STANDARD,
            'visibility' => Poll::VISIBILITY_PUBLIC,
            'status' => 'active',
            'start_at' => now(),
            'end_at' => $this->faker->optional()->dateTimeBetween('now', '+30 days'),
            'created_by' => \App\Models\User::factory(),
            'organization_id' => null,
        ];
    }

    /**
     * Indicate that the poll has options.
     */
    public function withOptions(int $count = 3): static
    {
        return $this->afterCreating(function (\App\Models\Poll $poll) use ($count) {
            for ($i = 0; $i < $count; $i++) {
                $poll->options()->create([
                    'text' => fake()->sentence(),
                    'order' => $i,
                ]);
            }
        });
    }

    /**
     * Indicate that the poll is a profile poll.
     */
    public function profilePoll(): static
    {
        return $this->state(fn(array $attributes) => [
            'poll_type' => Poll::POLL_TYPE_PROFILE,
        ]);
    }

    /**
     * Indicate that the poll is a profile poll with options.
     */
    public function withProfileOptions(int $count = 3): static
    {
        return $this->profilePoll()->afterCreating(function (\App\Models\Poll $poll) use ($count) {
            $positions = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Board Member'];
            for ($i = 0; $i < $count; $i++) {
                $poll->options()->create([
                    'text' => fake()->name(),
                    'name' => fake()->name(),
                    'position' => $positions[$i % count($positions)],
                    'image_url' => null,
                    'order' => $i,
                ]);
            }
        });
    }

    /**
     * Indicate that the poll is invite-only.
     */
    public function inviteOnly(): static
    {
        return $this->state(fn(array $attributes) => [
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);
    }

    /**
     * Indicate that the poll is public.
     */
    public function public(): static
    {
        return $this->state(fn(array $attributes) => [
            'visibility' => Poll::VISIBILITY_PUBLIC,
        ]);
    }
}
