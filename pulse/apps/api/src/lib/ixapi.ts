import IXAPI from "@/services/ixapi.service";

export const allTicketsWaiting = async () => await IXAPI.request({ finalDate: currentDateString, initialDate: twoHoursAgoDateString, reportType: 'ticket', status: 'W' });