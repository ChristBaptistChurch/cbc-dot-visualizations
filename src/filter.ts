export interface Filter {
    Id: string;
    DisplayAs: string;
    DataViewName: string;
    CSS: string;
    ActiveByDefault: boolean;
    Order: number;
    data?: Array<any>;

    // Dynamic - the number of people in this chart matching this person
    count?: number;
}