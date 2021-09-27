import { i18n } from "i18next";

//var ResponseCodeBookingSlotConflict: number             = 1001;
var ResponseCodeBookingLocationMaxConcurrent: number = 1002;
var ResponseCodeBookingTooManyUpcomingBookings: number = 1003;
var ResponseCodeBookingTooManyDaysInAdvance: number = 1004;
var ResponseCodeBookingInvalidBookingDuration: number = 1005;

export default class ErrorText {
    static getTextForAppCode(code: number, i18n: i18n, context: any): string {
        if (code === ResponseCodeBookingLocationMaxConcurrent) {
            return i18n.t("errorTooManyConcurrent");
        } else if (code === ResponseCodeBookingInvalidBookingDuration) {
            return i18n.t("errorBookingDuration", { "num": context.maxBookingDurationHours });
        } else if (code === ResponseCodeBookingTooManyDaysInAdvance) {
            return i18n.t("errorDaysAdvance", { "num": context.maxDaysInAdvance });
        } else if (code === ResponseCodeBookingTooManyUpcomingBookings) {
            return i18n.t("errorBookingLimit", { "num": context.maxBookingsPerUser });
        } else {
            return i18n.t("errorUnknown");
        }
    }
}
