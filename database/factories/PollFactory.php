<?php

namespace Database\Factories;

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
            'question' => $this->faker->sentence().'?',
            'description' => $this->faker->optional()->paragraph(),
            'type' => $this->faker->randomElement(['open', 'closed']),
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
}
