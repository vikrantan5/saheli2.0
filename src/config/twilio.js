// Twilio Configuration for SMS
// Get these values from: https://www.twilio.com/console
// 1. Sign up at https://www.twilio.com/try-twilio
// 2. Go to Console Dashboard: https://console.twilio.com/
// 3. Copy "Account SID" and "Auth Token"
// 4. Get a phone number from: https://console.twilio.com/phone-numbers

// TODO: Replace with your Twilio credentials
export const TWILIO_CONFIG = {
  accountSid: "YOUR_TWILIO_ACCOUNT_SID",
  authToken: "YOUR_TWILIO_AUTH_TOKEN",
  phoneNumber: "YOUR_TWILIO_PHONE_NUMBER" // Format: +1234567890
};

// Twilio API endpoint
export const TWILIO_SMS_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}/Messages.json`;
