<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_valid_registration_creates_customer_authenticates_session_and_returns_201(): void
    {
        $response = $this
            ->withHeader('Origin', 'http://localhost:4200')
            ->postJson('/api/v1/auth/register', [
                'name' => 'Aarav Sharma',
                'email' => ' AARAV@EXAMPLE.COM ',
                'password' => 'secure-password',
                'password_confirmation' => 'secure-password',
                'role' => 'admin',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Account created successfully.')
            ->assertJsonPath('data.name', 'Aarav Sharma')
            ->assertJsonPath('data.email', 'aarav@example.com')
            ->assertJsonPath('data.role', 'customer');

        $user = User::query()->where('email', 'aarav@example.com')->firstOrFail();
        $this->assertSame('customer', $user->role);
        $this->assertTrue(Hash::check('secure-password', $user->password));
        $this->assertAuthenticatedAs($user);
    }

    public function test_invalid_registration_returns_422_and_does_not_create_user(): void
    {
        $response = $this
            ->withHeader('Origin', 'http://localhost:4200')
            ->postJson('/api/v1/auth/register', []);

        $response
            ->assertUnprocessable()
            ->assertInvalid([
                'name' => 'The name field is required.',
                'email' => 'The email field is required.',
                'password' => 'The password field is required.',
            ]);
        $this->assertDatabaseCount('users', 0);
        $this->assertGuest();
    }

    public function test_registration_rejects_unconfirmed_password_with_422(): void
    {
        $response = $this
            ->withHeader('Origin', 'http://localhost:4200')
            ->postJson('/api/v1/auth/register', [
                'name' => 'Aarav Sharma',
                'email' => 'aarav@example.com',
                'password' => 'secure-password',
                'password_confirmation' => 'different-password',
            ]);

        $response
            ->assertUnprocessable()
            ->assertInvalid([
                'password' => 'The password field confirmation does not match.',
            ]);
        $this->assertDatabaseCount('users', 0);
        $this->assertGuest();
    }

    public function test_duplicate_email_registration_returns_422_and_does_not_authenticate(): void
    {
        User::factory()->create(['email' => 'aarav@example.com']);

        $response = $this
            ->withHeader('Origin', 'http://localhost:4200')
            ->postJson('/api/v1/auth/register', [
                'name' => 'Another Aarav',
                'email' => 'AARAV@EXAMPLE.COM',
                'password' => 'secure-password',
                'password_confirmation' => 'secure-password',
            ]);

        $response
            ->assertUnprocessable()
            ->assertInvalid([
                'email' => 'The email has already been taken.',
            ]);
        $this->assertDatabaseCount('users', 1);
        $this->assertGuest();
    }

    public function test_valid_credentials_authenticate_session_and_return_user(): void
    {
        $user = User::factory()->admin()->create([
            'email' => 'admin@caratline.test',
            'password' => 'password',
        ]);

        $response = $this
            ->withHeader('Origin', 'http://localhost:4200')
            ->postJson('/api/v1/auth/login', [
                'email' => 'admin@caratline.test',
                'password' => 'password',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Signed in successfully.')
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'admin');
        $this->assertAuthenticatedAs($user);
    }

    public function test_invalid_credentials_return_422_and_do_not_authenticate(): void
    {
        User::factory()->create([
            'email' => 'customer@caratline.test',
            'password' => 'password',
        ]);

        $response = $this
            ->withHeader('Origin', 'http://localhost:4200')
            ->postJson('/api/v1/auth/login', [
                'email' => 'customer@caratline.test',
                'password' => 'incorrect-password',
            ]);

        $response
            ->assertUnprocessable()
            ->assertInvalid(['email' => 'The provided credentials are incorrect.']);
        $this->assertGuest();
    }

    public function test_returns_401_for_unauthenticated_current_user_request(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertUnauthorized();
    }

    public function test_returns_authenticated_current_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/auth/me');

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'customer');
    }

    public function test_logout_invalidates_authenticated_session(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->withHeader('Origin', 'http://localhost:4200')
            ->postJson('/api/v1/auth/logout');

        $response->assertNoContent();
        $this->assertGuest('web');
    }
}
