# CubeNexus Business Flows

## Offline Tournament

### Manager / Delegate Flow

1. Manager logs in.
2. Manager creates a tournament.
3. Manager configures tournament details:
   - Tournament name
   - Description
   - Time limit
   - Competition format: Traditional or Medley
4. Manager saves the tournament.
5. System generates Groups and Scrambles.
6. System publishes the tournament.

### Player Flow

1. Player creates an account.
2. Player logs in.
3. Player opens the tournament page.
4. Player registers for the tournament.
5. System confirms the registration.
6. System generates a QR check-in code.
7. Player waits for the competition schedule.

### Judge + Competitor Check-in Flow

1. Player arrives at the competition table.
2. Player and Judge open the app.
3. Judge scans the Player QR code.
4. System verifies:
   - correct person
   - correct round
   - correct solve
5. Player starts the attempt.
6. Judge enters the Player result into the system.
7. System stores the result.

### Judge Result Entry Flow

1. Judge reads the time from the Stackmat timer.
2. Judge enters the time into the app.
3. If needed, Judge applies penalties:
   - +2 seconds
   - DNF
4. System validates the entry.
5. System shows the final result.
6. Player signs electronically.
7. Judge submits the result.
8. Live Board updates in real time.

### Medley Event Flow

1. Judge starts a Medley solve.
2. Judge enters each puzzle result.
3. System calculates:
   - total time
   - +2 for each error
4. If one puzzle is DNF, the full Medley attempt becomes DNF.
5. Judge submits the final result.

### Live Operations Flow

1. Tournament Manager opens the dashboard.
2. Manager views real-time progress:
   - Judge progress
   - Competitor status
   - Live rankings
3. Manager resolves disputes.
4. Manager locks results.
5. Manager advances the next round.

## Online Arena

### Player 1v1 Arena Flow

1. Player creates an account.
2. Player logs in.
3. Player opens Online Arena.
4. Player selects Find Match.
5. System adds the player to the matchmaking queue.
6. System finds an opponent with similar Elo.
7. System creates a Virtual Room.
8. Both players join the room.

### Virtual Room Preparation Flow

1. Player enters the Virtual Room.
2. Player enables webcam and microphone.
3. Webcam is positioned toward the hands and cube.
4. System connects the camera using WebRTC.
5. Opponents can see each other.
6. System generates a QR Session code.
7. QR Session is displayed on the web screen.

### Mobile Timer Sync Flow

1. Player opens the Mobile App.
2. Player scans the QR Session code.
3. Mobile App connects to the Socket Room.
4. System verifies the session.
5. Phone becomes the Smart Timer for the room.

### Online Match Flow

1. System generates a synchronized scramble.
2. System shows the countdown.
3. Both players place hands on the phone screen like a Stackmat timer.
4. Players release hands to start the timer.
5. Players solve the cube.
6. Players tap the screen to stop the timer.
7. Results are sent in real time.
8. System determines the winner.
9. System updates Elo.
10. System updates the realtime leaderboard.

### Report Flow

1. Player detects cheating.
2. Player selects Report.
3. System stores room data, webcam evidence, and replay data.
4. System Admin reviews the evidence.
5. If cheating is confirmed, Admin applies penalties:
   - Elo deduction
   - account ban
   - warning

### Asynchronous Online Tournament Flow

1. Player joins an online tournament.
2. System provides a scramble.
3. Player records a continuous solve video.
4. Player submits the video link and solve time.
5. System accepts the result.
6. System Admin reviews the video.
7. System approves or rejects the result.
8. Leaderboard updates.

### Guest / Spectator Flow

1. Guest opens the Web Portal.
2. Guest views Global Elo Ranking.
3. Guest views Top Players.
4. Guest views Match History.
5. Guest follows realtime match results.

### Realtime Leaderboard Flow

1. Online match ends.
2. System calculates the new Elo.
3. Socket Server pushes the update.
4. Web Portal and Online Arena refresh immediately.

### Web-Mobile Synchronization Core Flow

1. Player finds a match.
2. System matches opponents.
3. System creates a Virtual Room.
4. System starts webcam streaming with WebRTC.
5. System generates a QR Session.
6. Mobile App scans the QR code.
7. Socket synchronization is established.
8. Mobile becomes the Smart Timer.
9. Players solve in sync.
10. System submits the result.
11. System updates Elo.
12. Realtime ranking refreshes.

## Suggested Implementation Mapping

- Web App: Tournament Manager / Admin dashboard, Online Arena, live results views.
- Mobile App: Competitor practice, offline judge tools, QR scanning, Smart Timer.
- Core API: authentication, tournament CRUD, registration, result submission, Elo calculation.
- Realtime Services: Socket.io room sync, live board, leaderboard updates, matchmaking engine.
- WebRTC Service: webcam broadcast, evidence capture, cheating review.
- Storage: tournament data, scrambles, room logs, video report metadata.
- Security: JWT auth, role-based access, encrypted scramble files, audit logs.
