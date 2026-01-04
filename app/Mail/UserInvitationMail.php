<?php

namespace App\Mail;

use App\Models\UserInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public UserInvitation $invitation
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You\'ve been invited to join PollStack',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $acceptUrl = url("/invitations/accept/{$this->invitation->token}");
        $inviterName = $this->invitation->inviter->name;
        $expiresAt = $this->invitation->expires_at->diffForHumans();

        return new Content(
            view: 'emails.invitation',
            with: [
                'acceptUrl' => $acceptUrl,
                'inviterName' => $inviterName,
                'expiresAt' => $expiresAt,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
