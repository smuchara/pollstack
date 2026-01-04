<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>You've been invited to join {{ config('app.name') }}</title>
</head>

<body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
    <!-- Main Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
        style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <!-- Email Content -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
                    style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                    <!-- Header with Logo -->
                    <tr>
                        <td
                            style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 32px 40px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <img src="{{ url('images/pollstackicon_white.svg') }}"
                                            alt="{{ config('app.name') }}" width="48" height="48"
                                            style="display: block; margin: 0 auto 12px;">
                                        <h1
                                            style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                            {{ config('app.name') }}</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Hero Section -->
                    <tr>
                        <td
                            style="background: linear-gradient(to bottom, #EEF2FF, #ffffff); padding: 40px 40px 32px; text-align: center;">
                            <h2
                                style="margin: 0 0 16px; color: #1F2937; font-size: 32px; font-weight: 700; line-height: 1.2;">
                                You're Invited! 🎉</h2>
                            <p style="margin: 0; color: #6B7280; font-size: 16px; line-height: 1.6;">Join
                                {{ config('app.name') }} and start managing polls effortlessly</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Hello!
                            </p>
                            <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.6;">
                                <strong style="color: #4F46E5;">{{ $inviterName }}</strong> has invited you to join
                                {{ config('app.name') }}. Click the button below to accept the invitation and create
                                your account.
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 0 0 32px;">
                                        <a href="{{ $acceptUrl }}"
                                            style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Dashboard Preview -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 0 0 32px;">
                                        <img src="{{ url('images/onboarding.png') }}" alt="Dashboard Preview"
                                            width="520"
                                            style="max-width: 100%; height: auto; border-radius: 12px; border: 1px solid #E5E7EB; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiration Notice -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                                style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 0;">
                                        <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.5;">
                                            ⏰ <strong>Important:</strong> This invitation will expire {{ $expiresAt }}.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Security Notice -->
                            <p
                                style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                If you did not expect this invitation, no further action is required.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td
                            style="background-color: #F9FAFB; padding: 32px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 8px; color: #6B7280; font-size: 14px;">
                                Best regards,<br>
                                <strong style="color: #374151;">The {{ config('app.name') }} Team</strong>
                            </p>
                            <p style="margin: 16px 0 0; color: #9CA3AF; font-size: 12px;">
                                © {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>

</html>