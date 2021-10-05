import React from 'react';

export interface AuthContextData {
    token: string;
    url: string;
    username: string;
    isLoading: boolean;
    maxBookingsPerUser: number;
    maxDaysInAdvance: number;
    maxBookingDurationHours: number;
    dailyBasisBooking: boolean;
    showNames: boolean;
    defaultTimezone: string;
    setDetails: (token: string, username: string) => void;
};

export const AuthContext = React.createContext<AuthContextData>({
    token: "", 
    url: "",
    username: "", 
    isLoading: true, 
    maxBookingsPerUser: 0,
    maxDaysInAdvance: 0,
    maxBookingDurationHours: 0,
    dailyBasisBooking: false,
    showNames: false,
    defaultTimezone: "",
    setDetails: (token: string, username: string) => {},
});
