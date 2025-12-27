/**
 * Attendance Service
 * Handles attendance tracking with geolocation validation
 */

import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '@/lib/appwrite';
import { isWithinOfficeRadius } from '@/utils/geolocation.utils';

export interface AttendanceRecord {
    $id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    checkInLocation?: {
        lat: number;
        lng: number;
    };
    checkOutLocation?: {
        lat: number;
        lng: number;
    };
    status: 'present' | 'absent' | 'late' | 'half-day' | 'wfh';
    attendanceType: 'office' | 'wfh';
    workingHours?: number;
    $createdAt: string;
    $updatedAt: string;
}

export interface CheckInData {
    employeeId: string;
    employeeName: string;
    location: {
        lat: number;
        lng: number;
    };
    attendanceType: 'office' | 'wfh';
}

export interface AttendanceFilters {
    date?: string;
    employeeId?: string;
    status?: string;
    attendanceType?: 'office' | 'wfh';
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

class AttendanceService {
    /**
     * Check in for attendance
     */
    async checkIn(data: CheckInData): Promise<AttendanceRecord> {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const checkInTime = now.toISOString();

        // Validate geolocation for office attendance
        if (data.attendanceType === 'office') {
            const geoCheck = isWithinOfficeRadius(data.location.lat, data.location.lng);
            if (!geoCheck.isWithin) {
                throw new Error(
                    `You are ${geoCheck.distance}m away from the office. ` +
                    `Check-in is only allowed within ${geoCheck.allowedRadius}m radius. ` +
                    `Please move closer to the office or select Work From Home.`
                );
            }
        }

        // Check for existing attendance today
        const existingAttendance = await this.getTodayAttendance(data.employeeId);
        if (existingAttendance) {
            throw new Error('You have already checked in today.');
        }

        // Determine if late (after 9:30 AM)
        const lateThreshold = new Date(now);
        lateThreshold.setHours(9, 30, 0, 0);
        const isLate = now > lateThreshold;

        const attendance = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.ATTENDANCE,
            ID.unique(),
            {
                employeeId: data.employeeId,
                employeeName: data.employeeName,
                date: today,
                checkIn: checkInTime,
                checkInLocation: data.location,
                status: data.attendanceType === 'wfh' ? 'wfh' : (isLate ? 'late' : 'present'),
                attendanceType: data.attendanceType,
            }
        );

        return attendance as unknown as AttendanceRecord;
    }

    /**
     * Check out from attendance
     */
    async checkOut(
        attendanceId: string,
        location: { lat: number; lng: number }
    ): Promise<AttendanceRecord> {
        const attendance = await this.getAttendanceById(attendanceId);
        if (!attendance) {
            throw new Error('Attendance record not found.');
        }

        if (attendance.checkOut) {
            throw new Error('You have already checked out today.');
        }

        const checkOutTime = new Date();
        const checkInTime = new Date(attendance.checkIn || '');
        const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

        // Determine if half-day (less than 4 hours)
        let status = attendance.status;
        if (workingHours < 4 && status !== 'wfh') {
            status = 'half-day';
        }

        const updated = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.ATTENDANCE,
            attendanceId,
            {
                checkOut: checkOutTime.toISOString(),
                checkOutLocation: location,
                workingHours: Math.round(workingHours * 100) / 100,
                status,
            }
        );

        return updated as unknown as AttendanceRecord;
    }

    /**
     * Get attendance by ID
     */
    async getAttendanceById(attendanceId: string): Promise<AttendanceRecord | null> {
        try {
            const attendance = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.ATTENDANCE,
                attendanceId
            );
            return attendance as unknown as AttendanceRecord;
        } catch {
            return null;
        }
    }

    /**
     * Get today's attendance for an employee
     */
    async getTodayAttendance(employeeId: string): Promise<AttendanceRecord | null> {
        const today = new Date().toISOString().split('T')[0];
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ATTENDANCE,
            [
                Query.equal('employeeId', employeeId),
                Query.equal('date', today),
                Query.limit(1),
            ]
        );

        return response.documents[0] as unknown as AttendanceRecord || null;
    }

    /**
     * Get attendance records with filters
     */
    async getAttendance(filters?: AttendanceFilters): Promise<{
        records: AttendanceRecord[];
        total: number;
    }> {
        const queries: string[] = [];

        if (filters?.date) {
            queries.push(Query.equal('date', filters.date));
        }

        if (filters?.employeeId) {
            queries.push(Query.equal('employeeId', filters.employeeId));
        }

        if (filters?.status) {
            queries.push(Query.equal('status', filters.status));
        }

        if (filters?.attendanceType) {
            queries.push(Query.equal('attendanceType', filters.attendanceType));
        }

        if (filters?.startDate && filters?.endDate) {
            queries.push(Query.greaterThanEqual('date', filters.startDate));
            queries.push(Query.lessThanEqual('date', filters.endDate));
        }

        queries.push(Query.orderDesc('date'));
        queries.push(Query.orderDesc('$createdAt'));
        queries.push(Query.limit(filters?.limit || 50));

        if (filters?.offset) {
            queries.push(Query.offset(filters.offset));
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ATTENDANCE,
            queries
        );

        return {
            records: response.documents as unknown as AttendanceRecord[],
            total: response.total,
        };
    }

    /**
     * Get attendance by date
     */
    async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
        const { records } = await this.getAttendance({ date, limit: 500 });
        return records;
    }

    /**
     * Get employee attendance history
     */
    async getEmployeeAttendance(
        employeeId: string,
        startDate?: string,
        endDate?: string
    ): Promise<AttendanceRecord[]> {
        const { records } = await this.getAttendance({
            employeeId,
            startDate,
            endDate,
            limit: 100,
        });
        return records;
    }

    /**
     * Update attendance record (admin only)
     */
    async updateAttendance(
        attendanceId: string,
        data: Partial<AttendanceRecord>
    ): Promise<AttendanceRecord> {
        const updated = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.ATTENDANCE,
            attendanceId,
            data
        );
        return updated as unknown as AttendanceRecord;
    }

    /**
     * Get attendance statistics for a date
     */
    async getAttendanceStats(date?: string): Promise<{
        present: number;
        absent: number;
        late: number;
        halfDay: number;
        wfh: number;
        total: number;
    }> {
        const targetDate = date || new Date().toISOString().split('T')[0];

        const records = await this.getAttendanceByDate(targetDate);

        const stats = {
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            wfh: 0,
            total: records.length,
        };

        records.forEach(record => {
            switch (record.status) {
                case 'present':
                    stats.present++;
                    break;
                case 'late':
                    stats.late++;
                    break;
                case 'half-day':
                    stats.halfDay++;
                    break;
                case 'wfh':
                    stats.wfh++;
                    break;
                case 'absent':
                    stats.absent++;
                    break;
            }
        });

        return stats;
    }

    /**
     * Delete attendance record
     */
    async deleteAttendance(attendanceId: string): Promise<void> {
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.ATTENDANCE,
            attendanceId
        );
    }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
