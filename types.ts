
export enum EmployeeType {
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
  TECHNICIAN = 'TECHNICIAN',
}

export enum WorkUnitType {
  SCHOOL = 'SCHOOL',
  EDU_DEPT = 'EDU_DEPT',
  DIRECTORATE = 'DIRECTORATE',
  OTHER = 'OTHER',
}

export enum UserRole {
  ACAD_ADMIN = 'ACAD_ADMIN', // Admin of the Academy/System
  EDU_MANAGER = 'EDU_MANAGER', // Manager of a specific Work Unit
  EMPLOYEE = 'EMPLOYEE', // Regular Employee
}

// Added missing Role and Permission types
export type Role = 'Admin' | 'Teacher' | 'Trainer' | 'Administrative';
export type Permission = 'view_all' | 'edit_all' | 'add_new' | 'view_self' | 'edit_self' | 'view_trainees_data';

// Added missing UserSession interface
export interface UserSession {
  national_id: string;
  name: string;
  role: Role;
}

// Added missing EmployeeDetails interface
export interface EmployeeDetails {
    name: string;
    job_title: string;
    directorate: string;
    financial_grade: string;
    address: string;
    phone: string;
    employee_code?: string;
    nationality?: Nationality | string;
    religion?: Religion | string;
    marital_status?: MaritalStatus | string;
    group_type?: string;
    work_status?: string;
    actual_appointment_date?: string;
    work_start_date?: string;
    deemed_date?: string;
}

// New Enums for Personal Data
export enum Nationality {
  EGY = 'EGY',
  OTH = 'OTH',
}

export enum Religion {
  MUS = 'MUS',
  CHR = 'CHR',
  OTH = 'OTH',
}

export enum MaritalStatus {
  SIN = 'SIN',
  MAR = 'MAR',
  DIV = 'DIV',
  WID = 'WID',
}

export interface WorkUnit {
  id: number;
  unit_type: WorkUnitType;
  name_ar: string;
  governorate: string;
  parent_unit_id?: number;
  manager_national_id?: string; // Foreign Key to Employee (Manager)
  
  // Backwards compatibility / Auth service fields
  manager_id?: string | null;
  name?: string;
}

export interface TeacherDetails {
  specialization: string;
  educational_stage: string;
  is_certified: boolean;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string; // MIME type (application/pdf, image/jpeg, etc.)
  content: string; // Base64 string
  size: number;
  uploadDate: string;
}

export interface Qualification {
  id: string;
  degree: string; // e.g., Bachelor, Master, PhD
  institution: string; // University name
  year: string;
  grade?: string;
}

export interface TrainingRecord {
  id: string;
  courseName: string;
  provider: string; // e.g., Professional Academy for Teachers
  date: string;
  status: 'Completed' | 'Ongoing' | 'Planned';
}

export interface Employee {
  national_id: string; // Primary Key
  employee_code?: string; // HR Code
  full_name_ar: string;
  birth_date: string;
  phone_number: string;
  email: string;
  profile_picture?: string; // URL or Base64 string
  
  // New Personal Data
  nationality?: Nationality | string;
  religion?: Religion | string;
  marital_status?: MaritalStatus | string;

  job_title: string;
  
  // New Job Details
  group_type?: string; // المجموعة النوعية
  work_status?: string; // الموقف من العمل

  // Dates
  employment_date: string; // تاريخ التعيين
  actual_appointment_date?: string; // تاريخ التعيين الفعلي
  work_start_date?: string; // تاريخ استلام العمل
  deemed_date?: string; // التاريخ الاعتباري
  last_promotion_date?: string; // تاريخ آخر ترقية
  
  work_place_id: number;
  employee_type: EmployeeType;
  teacher_details?: TeacherDetails; // OneToOne relation
  
  documents?: EmployeeDocument[]; // Array of attached documents
  qualifications?: Qualification[]; // New: Academic Qualifications
  training_history?: TrainingRecord[]; // New: Training History

  // Backwards compatibility / Auth service fields
  academic_email?: string;
  password_hash?: string;
  role?: Role | string;
  details?: EmployeeDetails;
}

export interface User {
  id: number;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  role: UserRole;
  employee_national_id?: string; // Link to Employee
  work_unit_id?: number; // For Edu Managers, restricts them to this unit
  name?: string; // Helper for UI
}

// Helper for UI
export const EmployeeTypeLabels: Record<EmployeeType, string> = {
  [EmployeeType.TEACHER]: 'معلم',
  [EmployeeType.ADMIN]: 'إداري',
  [EmployeeType.TRAINER]: 'مدرب',
  [EmployeeType.TECHNICIAN]: 'فني',
};

export const WorkUnitTypeLabels: Record<WorkUnitType, string> = {
  [WorkUnitType.SCHOOL]: 'مدرسة',
  [WorkUnitType.EDU_DEPT]: 'إدارة تعليمية',
  [WorkUnitType.DIRECTORATE]: 'مديرية',
  [WorkUnitType.OTHER]: 'أخرى',
};

export const NationalityLabels: Record<Nationality, string> = {
  [Nationality.EGY]: 'مصري',
  [Nationality.OTH]: 'أخرى',
};

export const ReligionLabels: Record<Religion, string> = {
  [Religion.MUS]: 'مسلم',
  [Religion.CHR]: 'مسيحي',
  [Religion.OTH]: 'أخرى',
};

export const MaritalStatusLabels: Record<MaritalStatus, string> = {
  [MaritalStatus.SIN]: 'أعزب',
  [MaritalStatus.MAR]: 'متزوج',
  [MaritalStatus.DIV]: 'مطلق',
  [MaritalStatus.WID]: 'أرمل',
};

// AI & Training Related Types
export enum TeacherLevel {
  Assistant = 'معلم مساعد',
  Teacher = 'معلم',
  First = 'معلم أول',
  FirstA = 'معلم أول أ',
  Expert = 'معلم خبير',
  Senior = 'كبير معلمين'
}

export interface Teacher {
  id: string;
  fullName: string;
  nationalId: string;
  level: string; // Can match TeacherLevel enum values
  subject: string;
  school: string;
  trainingHours: number;
}

export enum TrainingStatus {
  Upcoming = 'قادمة',
  Active = 'جارية',
  Completed = 'مكتملة',
  Cancelled = 'ملغاة'
}

export interface TrainingCourse {
  id: string;
  title: string;
  instructor?: string;
  startDate?: string;
  endDate?: string;
  status: TrainingStatus;
  enrolled: number;
  capacity: number;
}
