<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Poll Invitation</title>
</head>

<body
    style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937;">

    <!-- Main Wrapper -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
        style="background-color: #f3f4f6; width: 100%;">
        <tr>
            <td align="center" style="padding: 40px 10px;">

                <!-- Card Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
                    style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); width: 100%; max-width: 600px;">

                    <!-- Header / Hero Section -->
                    <!-- Simulating the 'Image' header with a nice gradient and logo -->
                    <tr>
                        <td
                            style="background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%); padding: 40px; text-align: center; height: 160px; vertical-align: middle;">
                            <img src="{{ isset($message) ? $message->embed(public_path('images/pollstackicon_white.svg')) : url('images/pollstackicon_white.svg') }}"
                                alt="PollStack" width="60" style="display: block; margin: 0 auto; opacity: 0.9;">
                            <h1
                                style="color: #ffffff; margin: 20px 0 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
                                PollStack</h1>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 40px 20px;">
                            <h2
                                style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111827; line-height: 1.25;">
                                You're Invited to Vote!
                            </h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Hi {{ $user->name }},
                            </p>
                            <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                You have been invited to participate in a new poll. We value your input and would love
                                to hear your thoughts.
                            </p>

                            <!-- Poll Details List -->
                            <h3
                                style="margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                                Poll Details:</h3>

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                                style="margin-bottom: 32px;">
                                <!-- Topic -->
                                <tr>
                                    <td width="40" valign="middle" style="padding-bottom: 16px;">
                                        <div
                                            style="width: 32px; height: 32px; background-color: #EEF2FF; border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center;">
                                            <span style="font-size: 16px;">📊</span>
                                        </div>
                                    </td>
                                    <td valign="middle" style="padding-bottom: 16px; padding-left: 12px;">
                                        <span
                                            style="font-size: 16px; font-weight: 600; color: #1f2937;">{{ $poll->question }}</span>
                                        @if($poll->description)
                                            <div style="font-size: 14px; color: #6b7280; margin-top: 2px;">
                                                {{ Str::limit($poll->description, 60) }}</div>
                                        @endif
                                    </td>
                                </tr>

                                <!-- Start Date -->
                                <tr>
                                    <td width="40" valign="middle" style="padding-bottom: 16px;">
                                        <div
                                            style="width: 32px; height: 32px; background-color: #ECFDF5; border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center;">
                                            <span style="font-size: 16px;">🟢</span>
                                        </div>
                                    </td>
                                    <td valign="middle" style="padding-bottom: 16px; padding-left: 12px;">
                                        <span style="font-size: 14px; color: #6b7280;">Starts:</span>
                                        <span
                                            style="font-size: 15px; font-weight: 500; color: #1f2937; margin-left: 4px;">
                                            {{ $poll->start_at ? $poll->start_at->setTimezone($user->timezone ?? config('app.timezone'))->format('F j, Y g:i A') : 'Immediately' }}
                                        </span>
                                    </td>
                                </tr>

                                <!-- End Date -->
                                <tr>
                                    <td width="40" valign="middle">
                                        <div
                                            style="width: 32px; height: 32px; background-color: #FEF2F2; border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center;">
                                            <span style="font-size: 16px;">🔴</span>
                                        </div>
                                    </td>
                                    <td valign="middle" style="padding-left: 12px;">
                                        <span style="font-size: 14px; color: #6b7280;">Ends:</span>
                                        <span
                                            style="font-size: 15px; font-weight: 500; color: #1f2937; margin-left: 4px;">
                                            {{ $poll->end_at ? $poll->end_at->setTimezone($user->timezone ?? config('app.timezone'))->format('F j, Y g:i A') : 'No End Date' }}
                                        </span>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- CTA Wrapper (Dark Card Style) -->
                    <tr>
                        <td style="padding: 0 20px 40px;"> <!-- Padding outer -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                                style="background-color: #111827; border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td align="left" style="padding: 32px; position: relative; overflow: hidden;">

                                        <!-- Decorative Circle/Effect (Optional CSS) -->
                                        <!-- <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: radial-gradient(circle, #4F46E5 0%, transparent 70%); opacity: 0.5;"></div> -->

                                        <!-- Badge/Pill -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td
                                                    style="border: 1px solid #374151; border-radius: 9999px; padding: 4px 12px;">
                                                    <span
                                                        style="color: #9CA3AF; font-size: 12px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;">Voting
                                                        Open</span>
                                                </td>
                                            </tr>
                                        </table>

                                        <h3
                                            style="margin: 16px 0 8px; font-size: 20px; font-weight: 700; color: #ffffff;">
                                            Make Your Voice Heard
                                        </h3>
                                        <p
                                            style="margin: 0 0 24px; font-size: 14px; color: #9CA3AF; max-width: 400px; line-height: 1.5;">
                                            Participate in the decision-making process. Your vote counts towards the
                                            future of your organization.
                                        </p>

                                        <!-- CTA Button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="background-color: #4F46E5; border-radius: 6px;">
                                                    <a href="{{ route('polls.index') }}" target="_blank"
                                                        style="display: inline-block; padding: 12px 24px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
                                                        Participate Now &rarr;
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td
                            style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px; text-align: center;">
                            <div style="margin-bottom: 12px;">
                                <!-- Logo (Small) -->
                                <img src="{{ isset($message) ? $message->embed(public_path('images/pollstack.svg')) : url('images/pollstack.svg') }}"
                                    alt="PollStack" width="24" style="vertical-align: middle; opacity: 0.7;">
                                <span
                                    style="font-weight: 600; color: #374151; margin-left: 8px; vertical-align: middle; font-size: 14px;">PollStack</span>
                            </div>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                &copy; {{ date('Y') }} PollStack. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>

</html>