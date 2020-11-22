import i18n from 'i18next';
//import { LanguageDetectorAsyncModule, InitOptions, Services } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

/*
console.log("test 1");
class LanguageDetector implements LanguageDetectorAsyncModule {
    type: 'languageDetector' = 'languageDetector';
    async: true = true;
    detect = (callback: any) => {
        console.log("----> " + Localization.locale.split('-')[0]);
        callback("en");
    };
    init = (services: Services, detectorOptions: object, i18nextOptions: InitOptions) => {};
    cacheUserLanguage = (lng: string) => {};
}
const languageDetector = new LanguageDetector();
*/
const deviceLanguage = Localization.locale.split('-')[0];
const resources = {
    de: {
        translation: {
            "area": "Bereich",
            "space": "Platz",
            "selectSpace": "Wähle Deinen Platz",
            "myBookings": "Meine Buchungen",
            "findYourPlace": "Finde Deinen Platz.",
            "emailPlaceholder": "max@mustermann.de",
            "getStarted": "Loslegen",
            "back": "Zurück",
            "errorLogin": "Fehler bei der Anmeldung. Möglicherweise ist diese E-Mail-Adresse nicht mit einer Organisation verknüpft.",
            "errorNoAuthProviders": "Für diesen Nutzer stehen keine Anmelde-Möglichkeiten zur Verfügung.",
            "errorInvalidPassword": "Ungültiges Kennwort.",
            "signin": "Anmelden",
            "signout": "Abmelden",
            "password": "Kennwort",
            "signinAsAt": "Als {{user}} an {{org}} anmelden:",
            "noBookings": "Keine Buchungen gefunden.",
            "enter": "Beginn", 
            "leave": "Ende",
            "bookSeat": "Platz buchen",
            "none": "Keine",
            "user": "Benutzer",
            "settings": "Einstellungen",
            "errorBookingLimit": "Das Limit von {{num}} Buchungen wurde erreicht.",
            "errorPickArea": "Bitte einen Bereich auswählen.",
            "errorEnterFuture": "Der Beginn muss in der Zukunft liegen.",
            "errorLeaveAfterEnter": "Das Ende muss nach dem Beginn liegen.",
            "errorDaysAdvance": "Die Buchung darf maximal {{num}} Tage in der Zukunft liegen.",
            "errorBookingDuration": "Die maximale Buchungsdauer beträgt {{num}} Stunden.",
            "searchSpace": "Plätze suchen",
            "cancelBooking": "Stornieren",
            "ok": "OK",
            "confirmBooking": "Buchung bestätigen",
            "cancel": "Abbrechen",
            "bookingConfirmed": "Deine Buchung wurde bestätigt!"
        }
    },
    en: {
        translation: {
            "area": "Area",
            "space": "Space",
            "selectSpace": "Choose your space",
            "myBookings": "My bookings",
            "findYourPlace": "Find your space.",
            "emailPlaceholder": "you@company.com",
            "getStarted": "Get started",
            "back": "Back",
            "errorLogin": "An error occurred while signing you in. Your email address might not be associated with an organization.",
            "errorNoAuthProviders": "No authentication providers for your user.",
            "errorInvalidPassword": "Invalid password.",
            "signin": "Sign in",
            "signout": "Sign off",
            "password": "Password",
            "signinAsAt": "Sign in to {{org}} as {{user}}:",
            "noBookings": "No bookings.",
            "enter": "Enter", 
            "leave": "Leave",
            "bookSeat": "Book a space",
            "none": "None",
            "user": "User",
            "settings": "Settings",
            "errorBookingLimit": "You've reached the limit of {{num}} bookings.",
            "errorPickArea": "Please pick an area.",
            "errorEnterFuture": "Enter date must be in the future.",
            "errorLeaveAfterEnter": "Leave date must be after enter date.",
            "errorDaysAdvance": "Your booking must not be more than {{num}} days in advance.",
            "errorBookingDuration": "The maximum booking duration is {{num}} hours.",
            "searchSpace": "Find a space",
            "cancelBooking": "Cancel",
            "ok": "OK",
            "confirmBooking": "Confirm booking",
            "cancel": "Cancel",
            "bookingConfirmed": "Your booking has been confirmed!"
        }
    }
};

i18n
//.use(languageDetector)
.use(initReactI18next)
.init({
    resources,
    lng: deviceLanguage,
    fallbackLng: "en",
    keySeparator: false
});

export default i18n;
