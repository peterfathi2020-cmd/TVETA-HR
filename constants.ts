
import { Employee, Permission, Role, WorkUnit, EmployeeType, WorkUnitType, Nationality, Religion, MaritalStatus } from './types';

// Pre-calculated SHA-256 hashes for demo purposes
// Pass123! -> 51eac6b772421f64483754764b732551403c94f50974862419c8d0a4c084f676
// AdminSecure! -> 45a4436544600277341e30a57e233d9641753900d720c24c784407519114704c

// استخدم ملف لوجو محلي لسرعة التحميل وضمان الظهور في الطباعة
export const ACADEMY_LOGO_URL = "/logo.png";

export const EGYPT_GOVERNORATES = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "المنوفية", 
    "القليوبية", "البحيرة", "الغربية", "بور سعيد", "دمياط", "الإسماعيلية", 
    "السويس", "كفر الشيخ", "الفيوم", "بني سويف", "المنيا", "أسيوط", 
    "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", 
    "مطروح", "شمال سيناء", "جنوب سيناء"
];

// Comprehensive Database of Technical Schools
export const DB_WORK_UNITS: Record<string, WorkUnit> = {
  // --- Administrative Units ---
  "101": { id: 101, unit_type: WorkUnitType.DIRECTORATE, name: "الأكاديمية المهنية للمعلمين - المقر الرئيسي", name_ar: "الأكاديمية المهنية للمعلمين - المقر الرئيسي", governorate: "القاهرة", manager_id: "28303012500333", latitude: 30.0444, longitude: 31.2357 },
  "102": { id: 102, unit_type: WorkUnitType.EDU_DEPT, name: "إدارة شرق مدينة نصر التعليمية", name_ar: "إدارة شرق مدينة نصر التعليمية", governorate: "القاهرة", manager_id: null, latitude: 30.0566, longitude: 31.3301 },
  "103": { id: 103, unit_type: WorkUnitType.EDU_DEPT, name: "إدارة شمال الجيزة التعليمية", name_ar: "إدارة شمال الجيزة التعليمية", governorate: "الجيزة", latitude: 30.0131, longitude: 31.2089 },
  
  // --- CAIRO GOVERNORATE (القاهرة) ---
  "1001": { id: 1001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة تكنولوجيا الصيانة الفنية المتقدمة (ITEC)", governorate: "القاهرة", latitude: 30.0444, longitude: 31.2357 },
  "1002": { id: 1002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة جلال فهمي الثانوية الفنية المتقدمة", governorate: "القاهرة", latitude: 30.0666, longitude: 31.2457 },
  "1009": { id: 1009, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة 15 مايو الصناعية المتقدمة", governorate: "القاهرة", latitude: 29.8500, longitude: 31.3667 },
  
  // --- GIZA GOVERNORATE (الجيزة) ---
  "2004": { id: 2004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة 6 أكتوبر الصناعية المتقدمة", governorate: "الجيزة", latitude: 29.9722, longitude: 30.9417 },
  
  // --- ASYUT GOVERNORATE (أسيوط) ---
  "15002": { id: 15002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة منفلوط الثانوية الصناعية", governorate: "أسيوط", manager_id: "28303012500333", latitude: 27.3114, longitude: 30.9703 },
};

export const DB_EMPLOYEES: Record<string, Employee> = {
  "90123456789012": { 
      national_id: "90123456789012",
      full_name_ar: "محمد أحمد علي",
      email: "mohamed.a@academy.edu.eg",
      academic_email: "mohamed.a@academy.edu.eg",
      password_hash: "51eac6b772421f64483754764b732551403c94f50974862419c8d0a4c084f676",
      role: "Teacher",
      phone_number: "010xxxxxxx",
      birth_date: "1980-01-01",
      job_title: "معلم لغة عربية",
      employment_date: "2012-03-18",
      work_place_id: 102,
      employee_type: EmployeeType.TEACHER,
      qualifications: [
          { id: '1', degree: 'ليسانس آداب وتربية', institution: 'جامعة القاهرة', year: '2001', grade: 'جيد جداً' },
          { id: '2', degree: 'دبلومة مهنية في المناهج', institution: 'جامعة عين شمس', year: '2005' }
      ],
      training_history: [
          { id: '1', courseName: 'استراتيجيات التدريس الحديثة', provider: 'الأكاديمية المهنية للمعلمين', date: '2023-05-15', status: 'Completed' },
          { id: '2', courseName: 'التحول الرقمي في التعليم', provider: 'وزارة الاتصالات', date: '2024-01-10', status: 'Completed' }
      ],
      details: {
          name: "محمد أحمد علي",
          job_title: "معلم لغة عربية",
          directorate: "مديرية القاهرة التعليمية",
          financial_grade: "الأولى",
          address: "القاهرة، مدينة نصر",
          phone: "010xxxxxxx",
          employee_code: "22779731",
          nationality: "EGY",
          religion: "MUS",
          marital_status: "MAR",
          group_type: "وظائف أعضاء هيئة التعليم",
          work_status: "علي رأس عمله",
          actual_appointment_date: "2012-03-18",
          work_start_date: "2014-03-23",
          deemed_date: "2012-03-02"
      }
  },
  "28303012500333": {
      national_id: "28303012500333",
      employee_code: "2997660",
      full_name_ar: "بيتر فتحي حليم",
      email: "peterfathi2020@gmail.com",
      academic_email: "peterfathi2020@gmail.com",
      password_hash: "45a4436544600277341e30a57e233d9641753900d720c24c784407519114704c", // Hashed 'AdminSecure' (fallback)
      role: "Admin",
      phone_number: "01200724259",
      birth_date: "1983-03-01",
      job_title: "معلم أول (مشرف قسم)",
      employment_date: "2015-09-01",
      actual_appointment_date: "2015-09-01",
      work_start_date: "2015-09-01",
      deemed_date: "2015-09-01",
      last_promotion_date: "2023-05-22",
      work_place_id: 15002, // منفلوط الثانوية الصناعية
      employee_type: EmployeeType.TEACHER,
      qualifications: [
          { id: '1', degree: 'بكالوريوس تعليم صناعي - إنشاءات مدنية', institution: 'كلية التعليم الصناعي - جامعة بني سويف', year: '2004', grade: 'جيد' },
          { id: '3', degree: 'دبلومة مهنية - تكنولوجيا التعليم', institution: 'جامعة أسيوط', year: '2025', grade: 'جيد جدا' }
      ],
      training_history: [
           { id: '1', courseName: 'التحول الرقمي (7 Modules)', provider: 'جامعة أسيوط', date: '2025', status: 'Completed' },
           { id: '2', courseName: 'ICDL', provider: 'غير محدد', date: '2015', status: 'Completed' },
           { id: '3', courseName: 'Autocad 2D & 3D max', provider: 'Egypt', date: '2008', status: 'Completed' }
      ],
      teacher_details: {
          specialization: 'عمارة (تخصص مدني)',
          educational_stage: 'ثانوي صناعي',
          is_certified: true
      },
      details: {
          name: "بيتر فتحي حليم",
          job_title: "معلم أول (مشرف قسم)",
          directorate: "أسيوط - منفلوط",
          financial_grade: "الأولى",
          address: "أسيوط",
          phone: "01200724259",
          employee_code: "2997660",
          nationality: "EGY",
          religion: Religion.CHR,
          marital_status: MaritalStatus.MAR,
          group_type: "المجموعة النوعية لوظائف أعضاء هيئة التعليم",
          work_status: "علي رأس عمله",
          actual_appointment_date: "2015-09-01",
          work_start_date: "2015-09-01",
          deemed_date: "2015-09-01"
      }
  }
};

export const PERMISSION_LEVELS: Record<Role, Permission[]> = {
  "Admin": ["view_all", "edit_all", "add_new"],
  "Teacher": ["view_self", "edit_self"],
  "Trainer": ["view_self", "edit_self", "view_trainees_data"],
  "Administrative": ["view_self", "edit_self"]
};
