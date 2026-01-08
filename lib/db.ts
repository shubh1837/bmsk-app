import Dexie, { Table } from 'dexie';

export interface LocalStation {
    id: string;
    stationNumber: string;
    stationType: string;
    district: string;
    block: string;
    panchayat: string;
    latitude: number;
    longitude: number;
    location?: string;
}

export interface LocalTourPlan {
    id: string; // Server ID or local guid
    startDate: Date;
    endDate: Date;
    status: string;
    items: {
        stationId: string;
        order: number;
        visited: boolean;
        stationNumber: string; // denormalized for ease
        planDate?: Date;
    }[];
    activeTrip?: any;
}

export interface LocalReport {
    id?: number; // Autoinc
    tripId?: string; // If part of a tracked trip
    stationId: string;
    visitDate: Date;
    formData: any; // JSON
    images: { blob: Blob, timestamp: number, lat: number, lng: number }[];
    syncStatus: 'PENDING' | 'SYNCED' | 'ERROR';
}

export class BMSKDatabase extends Dexie {
    stations!: Table<LocalStation>;
    plans!: Table<LocalTourPlan>;
    reports!: Table<LocalReport, number>;

    constructor() {
        super('BMSK_Offline_DB');
        this.version(2).stores({
            stations: 'id, stationNumber, district',
            plans: 'id, startDate, endDate, status',
            reports: '++id, syncStatus, stationId' // ++id is auto-increment
        });
    }
}

export const db = new BMSKDatabase();
