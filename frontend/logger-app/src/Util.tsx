import { DateTuple } from "./App";

export function getInitialTimeframeOption(): string {
    const now = new Date();
    return String((now.getUTCMonth()+1) + "/" + now.getUTCFullYear());
}

export function getInitialDateTuple(): DateTuple {
    const now = new Date();
    return ({
        month: now.getUTCMonth()+1,
        year: now.getUTCFullYear()
    } as DateTuple);
}