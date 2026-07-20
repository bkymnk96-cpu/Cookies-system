# ZEUS Dashboard

The dashboard is intentionally implemented as an in-process ZEUS service so saved guild-scoped settings are written through the existing MongoDB-backed `keyValueService` namespaces. It uses Discord OAuth2 (`CLIENT_ID`, `CLIENT_SECRET`, `DASHBOARD_BASE_URL`) and filters the visible guild list to guilds where the user has Manage Guild permissions and ZEUS is present.

The visual language was mapped from `moderation-bot-main.zip`: fixed sidebar, grouped navigation, top navigation, cards, dark mode, mobile drawer, save bar, toast notifications, module configuration pages, and a touch-friendly welcome image editor.

## System map

- Commands -> `systemDB:command_settings_<guildId>` plus existing `shortcutDB:shortcuts_<guildId>`.
- Welcome -> existing `systemDB:welcome_config_<guildId>` through `utils/welcomeUtils`.
- Tickets -> `ticketDB:ticket_dashboard_<guildId>` while preserving live ticket metadata keys.
- Applications -> `applyDB:apply_settings_<guildId>`.
- Protection -> `protectDB:protection_config_<guildId>`.
- Logs -> `logsDB:logs_config_<guildId>`.
- Auto Reply -> `CookiesDB:replys_<guildId>`.
- Suggestions -> `suggestionsDB:suggestions_config_<guildId>`.
- Feedback -> `feedbackDB:feedback_config_<guildId>`.
- Broadcast -> existing `BroadcastDB:broadcast_msg_<guildId>` and `BroadcastDB:tokens_<guildId>` with masked token display.
- Activity -> existing `activityDB:text_<guildId>` and `activityDB:voice_<guildId>` from ZEUS runtime tracking.
- Admin Points -> existing `systemDB:admin_points_config_<guildId>` and `systemDB:admin_points_<guildId>`.

## Runtime refresh

Writes go through `keyValueService.set`, updating the service cache immediately. Slash command execution now reads the same guild-scoped command settings before executing a command, so dashboard disable/permission/channel changes take effect without a bot restart.
