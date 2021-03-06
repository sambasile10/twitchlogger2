import { DateTuple, TimeframeData } from "./App";

function getInitialTimeframeOption(): string {
    const now = new Date();
    return String((now.getUTCMonth()+1) + "/" + now.getUTCFullYear());
}

function getInitialDateTuple(): DateTuple {
    const now = new Date();
    return ({
        month: now.getUTCMonth()+1,
        year: now.getUTCFullYear()
    } as DateTuple);
}

export function getInitialTimeframeData(): TimeframeData {
    let data: TimeframeData = {
        timeframes: [ getInitialDateTuple() ],
        options: [ getInitialTimeframeOption() ]
    };

    return data;
}

function getTimeframes(tables: any): DateTuple[] {
    let tuples: DateTuple[] = [];
    for(let i = 0; i < tables.length; i++) {
        const split = String(tables[i].table_name).split('_');
        tuples.push({
            year: Number(split[1]),
            month: Number(split[2])
        } as DateTuple);
        console.log(tables[i]);
    }

    tuples.sort((a: DateTuple, b: DateTuple) => {
        return new Date(String('01' + '/' + b.month + '/' + b.year)).getTime() - new Date(String('01' + '/' + a.month + '/' + a.year)).getTime();
    })

    console.log(tuples);
    
    return tuples;
}

function formatTimeOptions(tuples: DateTuple[]): string[] {
    let options: string[] = [];
    for(let i = 0; i < tuples.length; i++) {
        const tuple: DateTuple = tuples[i];
        options.push(String(tuple.month + "/" + tuple.year));
    }
    
    return options;
}

export function getTimeframeData(tables: any): TimeframeData {
    let timeframes: DateTuple[] = getTimeframes(tables);
    let options: string[] = formatTimeOptions(timeframes);
    return ({
        timeframes: timeframes,
        options: options
    } as TimeframeData);
}