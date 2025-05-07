# DORA - Urdu Voice Scheduler

DORA is a web application that allows users to schedule events using Urdu voice input. It integrates with Google Calendar to create, manage, and delete events. The application leverages modern web technologies like **Next.js**, **React**, **Tailwind CSS**, and **Radix UI**, along with **OpenAI Whisper API** for transcription and **Google Calendar API** for event scheduling.

---

## Features

- **Urdu Voice Scheduling**: Record your voice in Urdu to schedule events.
- **Google Calendar Integration**: View, create, update, and delete events directly in Google Calendar.
- **Real-Time Debugging**: View current time, timezone, and other debug information.
- **Authentication**: Secure login using Google OAuth via **NextAuth.js**.
- **Responsive UI**: Built with Tailwind CSS and Radix UI for a seamless experience across devices.

---

## Prerequisites

Before running the application, ensure you have the following:

1. **Node.js**: Version 16 or later.
2. **pnpm**: Install globally using:
   ```bash
   npm install -g pnpm
3. **Google Cloud Project**:
- Enable the Google Calendar API.
- Create OAuth 2.0 credentials and download the client ID and secret.
4. **OpenAI API Key**:
- Obtain an API key from OpenAI for Whisper transcription.


## Installation
1. Clone the repository
```bash
   git clone https://github.com/abdullaharif381/dora-a3
   cd dora-a3
```

2. Install dependencies 
`pnpm install`

3. Configure environment variables. Create a `.env.local` file in the root directory and add the following variables:

```bash
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
OPENAI_API_KEY=<your-openai-api-key>
NEXTAUTH_SECRET=<your-nextauth-secret>
NEXTAUTH_URL=http://localhost:3000 
```

## Running the Application

1. Start the development server:
   ```bash
   pnpm dev

   ```

2. To build production:
   ```bash
   pnpm build
   ```
3. To start the production server:
   ```bash
   pnpm start
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Using the Application
1. Sign in with your Google account to access your Google Calendar.

2. Once logged in, you will see the main interface with options to view, create, update, and delete events.

3. Use the "Record" button to start recording your voice. Speak in Urdu to schedule an event. The application will transcribe your voice and create an event in your Google Calendar.

4. You can also manually create, update, or delete events using the provided buttons.

5. The debug section will show the current time, timezone, and other relevant information.

## Key Functionality

- **Voice Recording**: Users can record their voice in Urdu using the Web Speech API. The recorded audio is then sent to the OpenAI Whisper API for transcription.


- **Event Creation**: Users can create events by speaking in Urdu. The application uses the OpenAI Whisper API to transcribe the voice input into text and then creates an event in Google Calendar.

- **Event Management**: Users can view, update, and delete events from their Google Calendar directly through the application.

## Contributing
We welcome contributions to DORA! If you have suggestions for improvements, bug fixes, or new features, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a clear description of your changes.
4. Ensure your code adheres to the project's coding standards and includes tests where applicable.


Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

## Future Improvements
- **Chatbot Interface**: Implement a chatbot interface for more interactive scheduling.
- **Multi-User Support**: Allow multiple users to use the application with separate Google Calendar accounts.
- **Enhanced Voice Recognition**: Improve the accuracy of voice recognition and transcription for Urdu.
- **User Feedback System**: Implement a feedback system to gather user input on the application’s performance and features.
- **Event Notifications**: Add notifications for upcoming events and reminders.
- **Accessibility Features**: Implement features to make the application more accessible to users with disabilities.
- **Data Visualization**: Provide visual representations of scheduled events, such as calendars or charts.
- **Offline Support**: Implement offline capabilities to allow users to schedule events without an internet connection.
- **Integration with Other Calendars**: Extend support for other calendar services like Outlook, Apple Calendar, etc.
- **User Profiles**: Allow users to create profiles to save their preferences and settings.
- **Search Functionality**: Implement a search feature to find events quickly.
- **Event Categories**: Allow users to categorize events for better organization.
- **Dark Mode**: Implement a dark mode for better usability in low-light conditions.
- **Customizable Voice Commands**: Allow users to customize voice commands for scheduling events.
- **Analytics Dashboard**: Provide users with insights into their scheduled events, such as frequency, duration, etc.
- **Social Sharing**: Allow users to share events on social media platforms.
- **Event Collaboration**: Enable users to collaborate on events with others, such as sharing event details or inviting participants.

- **Multi-Language Support**: Extend support for multiple languages beyond Urdu.
- **Enhanced UI/UX**: Improve the user interface and experience based on user feedback.
- **Mobile App**: Develop a mobile version of the application for iOS and Android.
- **Advanced Event Features**: Add features like reminders, recurring events, and event sharing.
- **User Preferences**: Allow users to customize their experience, such as preferred language, theme, etc.
- **Performance Optimization**: Optimize the application for better performance and scalability.


## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements
- Next.js, React, Tailwind CSS, and Radix UI for the frontend framework and styling.
- Google Calendar API for event management.
- OpenAI Whisper API for voice transcription.
- Web Speech API for voice recording and recognition.




