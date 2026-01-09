// Export all services from a single entry point
export { authService, type AuthUser, type UserRole } from './auth.service';
export { employeeService, type Employee, type CreateEmployeeData, type UpdateEmployeeData } from './employee.service';
export { attendanceService, type AttendanceRecord, type CheckInData } from './attendance.service';
