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

export function getTimeframes(tables: any): DateTuple[] {
    let tuples: DateTuple[] = [];
    for(let i = 0; i < tables.length; i++) {
        const split = String(tables[i].table_name).split('_');
        tuples.push({
            year: Number(split[1]),
            month: Number(split[2])
        } as DateTuple);
        console.log(tables[i]);
    }
    
    return tuples;
}

export function formatTimeOptions(tuples: DateTuple[]): string[] {
    let options: string[] = [];
    for(let i = 0; i < tuples.length; i++) {
        const tuple: DateTuple = tuples[i];
        options.push(String(tuple.month + "/" + tuple.year));
    }
    
    return options;
}