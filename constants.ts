
import { Employee, Permission, Role, WorkUnit, EmployeeType, WorkUnitType, Nationality, Religion, MaritalStatus } from './types';

// Pre-calculated SHA-256 hashes for demo purposes
// Pass123! -> 51eac6b772421f64483754764b732551403c94f50974862419c8d0a4c084f676
// AdminSecure! -> 45a4436544600277341e30a57e233d9641753900d720c24c784407519114704c

export const ACADEMY_LOGO_URL = "https://i.postimg.cc/Gtdn21c4/123456.jpg";

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
  "101": { id: 101, unit_type: WorkUnitType.DIRECTORATE, name: "الأكاديمية المهنية للمعلمين - المقر الرئيسي", name_ar: "الأكاديمية المهنية للمعلمين - المقر الرئيسي", governorate: "القاهرة", manager_id: "28303012500333" },
  "102": { id: 102, unit_type: WorkUnitType.EDU_DEPT, name: "إدارة شرق مدينة نصر التعليمية", name_ar: "إدارة شرق مدينة نصر التعليمية", governorate: "القاهرة", manager_id: null },
  "103": { id: 103, unit_type: WorkUnitType.EDU_DEPT, name: "إدارة شمال الجيزة التعليمية", name_ar: "إدارة شمال الجيزة التعليمية", governorate: "الجيزة" },
  
  // --- CAIRO GOVERNORATE (القاهرة) ---
  // Industrial
  "1001": { id: 1001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة تكنولوجيا الصيانة الفنية المتقدمة (ITEC)", governorate: "القاهرة" },
  "1002": { id: 1002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة جلال فهمي الثانوية الفنية المتقدمة", governorate: "القاهرة" },
  "1003": { id: 1003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة شبرا الميكانيكية بنين", governorate: "القاهرة" },
  "1004": { id: 1004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة العباسية الميكانيكية", governorate: "القاهرة" },
  "1005": { id: 1005, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة دار السلام المعمارية", governorate: "القاهرة" },
  "1006": { id: 1006, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الزاوية الحمراء الفنية المتقدمة", governorate: "القاهرة" },
  "1007": { id: 1007, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة السلام الثانوية الصناعية بنات", governorate: "القاهرة" },
  "1008": { id: 1008, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة حلوان الثانوية الصناعية بنات", governorate: "القاهرة" },
  "1009": { id: 1009, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة 15 مايو الصناعية المتقدمة", governorate: "القاهرة" },
  "1010": { id: 1010, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الرضوانية الصناعية بنين", governorate: "القاهرة" },
  // Commercial & Hotel
  "1020": { id: 1020, unit_type: WorkUnitType.SCHOOL, name_ar: "المدرسة الفندقية المتقدمة بمدينة نصر", governorate: "القاهرة" },
  "1021": { id: 1021, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة السيدة زينب التجارية بنات", governorate: "القاهرة" },
  "1022": { id: 1022, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة عابدين التجارية بنين", governorate: "القاهرة" },
  "1023": { id: 1023, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الزيتون التجارية المتقدمة", governorate: "القاهرة" },

  // --- GIZA GOVERNORATE (الجيزة) ---
  // Industrial
  "2001": { id: 2001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الجيزة الكهربية", governorate: "الجيزة" },
  "2002": { id: 2002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة إمبابة الثانوية الصناعية", governorate: "الجيزة" },
  "2003": { id: 2003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الطباعة السرية الصناعية", governorate: "الجيزة" },
  "2004": { id: 2004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة 6 أكتوبر الصناعية المتقدمة", governorate: "الجيزة" },
  "2005": { id: 2005, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الطالبية المعمارية", governorate: "الجيزة" },
  "2006": { id: 2006, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة أطفيح الثانوية الصناعية", governorate: "الجيزة" },
  "2007": { id: 2007, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الصف الثانوية الصناعية بنات", governorate: "الجيزة" },
  // Agricultural & Commercial
  "2020": { id: 2020, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الثانوية الزراعية بالهرم", governorate: "الجيزة" },
  "2021": { id: 2021, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الأورمان التجارية الفندقية", governorate: "الجيزة" },
  "2022": { id: 2022, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الجيزة الفندقية المتقدمة", governorate: "الجيزة" },

  // --- ALEXANDRIA GOVERNORATE (الإسكندرية) ---
  "3001": { id: 3001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الإسكندرية الفنية المتقدمة", governorate: "الإسكندرية" },
  "3002": { id: 3002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الشاطبي الميكانيكية", governorate: "الإسكندرية" },
  "3003": { id: 3003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة محرم بك الصناعية بنين", governorate: "الإسكندرية" },
  "3004": { id: 3004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الورديان الثانوية الصناعية بنات", governorate: "الإسكندرية" },
  "3005": { id: 3005, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة رأس التين الثانوية الصناعية", governorate: "الإسكندرية" },
  "3006": { id: 3006, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة برج العرب الصناعية", governorate: "الإسكندرية" },
  "3007": { id: 3007, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة سموحة الفنية التجارية المتقدمة", governorate: "الإسكندرية" },

  // --- QALYUBIA GOVERNORATE (القليوبية) ---
  "4001": { id: 4001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة بنها الميكانيكية", governorate: "القليوبية" },
  "4002": { id: 4002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة شبرا الخيمة الصناعية بنات", governorate: "القليوبية" },
  "4003": { id: 4003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة مسطرد الثانوية الزراعية", governorate: "القليوبية" },
  "4004": { id: 4004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة عرب جهينة الصناعية", governorate: "القليوبية" },
  "4005": { id: 4005, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة طوخ الثانوية الصناعية", governorate: "القليوبية" },

  // --- SHARKIA GOVERNORATE (الشرقية) ---
  "5001": { id: 5001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة السويدي للتكنولوجيا التطبيقية", governorate: "الشرقية" },
  "5002": { id: 5002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الزقازيق المعمارية الزخرفية", governorate: "الشرقية" },
  "5003": { id: 5003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة بلبيس الثانوية الصناعية بنين", governorate: "الشرقية" },
  "5004": { id: 5004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة فاقوس الثانوية الصناعية", governorate: "الشرقية" },
  "5005": { id: 5005, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الصالحية الجديدة الزراعية", governorate: "الشرقية" },

  // --- DAKAHLIA GOVERNORATE (الدقهلية) ---
  "6001": { id: 6001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة المنصورة الميكانيكية", governorate: "الدقهلية" },
  "6002": { id: 6002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة المنصورة الزخرفية", governorate: "الدقهلية" },
  "6003": { id: 6003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة طلخا الثانوية الصناعية", governorate: "الدقهلية" },
  "6004": { id: 6004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة المنصورة الزراعية", governorate: "الدقهلية" },
  "6005": { id: 6005, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة المنصورة التجارية المتقدمة", governorate: "الدقهلية" },

  // --- MONUFIA GOVERNORATE (المنوفية) ---
  "7001": { id: 7001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة العربي للتكنولوجيا التطبيقية", governorate: "المنوفية" },
  "7002": { id: 7002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة شبين الكوم الثانوية الصناعية بنات", governorate: "المنوفية" },
  "7003": { id: 7003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة قويسنا الثانوية الصناعية", governorate: "المنوفية" },
  "7004": { id: 7004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة أشمون الثانوية التجارية", governorate: "المنوفية" },

  // --- GHARBIA GOVERNORATE (الغربية) ---
  "8001": { id: 8001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة طنطا الميكانيكية", governorate: "الغربية" },
  "8002": { id: 8002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة المحلة الكبرى الصناعية بنات", governorate: "الغربية" },
  "8003": { id: 8003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة كفر الزيات الثانوية الصناعية", governorate: "الغربية" },
  "8004": { id: 8004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة زفتى الثانوية الزخرفية", governorate: "الغربية" },

  // --- BEHEIRA GOVERNORATE (البحيرة) ---
  "9001": { id: 9001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة دمنهور الميكانيكية", governorate: "البحيرة" },
  "9002": { id: 9002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة كفر الدوار الثانوية الصناعية", governorate: "البحيرة" },
  "9003": { id: 9003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة دمنهور الثانوية الزراعية", governorate: "البحيرة" },
  
  // --- PORT SAID (بورسعيد) ---
  "10001": { id: 10001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة بورسعيد البحرية", governorate: "بور سعيد" },
  "10002": { id: 10002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة بورسعيد الفنية المتقدمة", governorate: "بور سعيد" },
  "10003": { id: 10003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة ظهر للتكنولوجيا التطبيقية", governorate: "بور سعيد" },
  "10004": { id: 10004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة بورسعيد التجارية بنين", governorate: "بور سعيد" },

  // --- ISMAILIA (الإسماعيلية) ---
  "11001": { id: 11001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة تكنولوجيا المعلومات بالإسماعيلية", governorate: "الإسماعيلية" },
  "11002": { id: 11002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الإسماعيلية الميكانيكية", governorate: "الإسماعيلية" },
  "11003": { id: 11003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الكهربية بنات بالإسماعيلية", governorate: "الإسماعيلية" },

  // --- SUEZ (السويس) ---
  "12001": { id: 12001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة السويس الصناعية المتقدمة", governorate: "السويس" },
  "12002": { id: 12002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة البتروكيماويات بالسويس", governorate: "السويس" },

  // --- UPPER EGYPT (الصعيد) ---
  // Beni Suef
  "13001": { id: 13001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة بني سويف الميكانيكية", governorate: "بني سويف" },
  "13002": { id: 13002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة بني سويف الزخرفية", governorate: "بني سويف" },
  // Minya
  "14001": { id: 14001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة المنيا المعمارية الزخرفية", governorate: "المنيا" },
  "14002": { id: 14002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة ملوي الثانوية الصناعية", governorate: "المنيا" },
  // Asyut
  "15001": { id: 15001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة أسيوط الميكانيكية", governorate: "أسيوط" },
  "15002": { id: 15002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة منفلوط الثانوية الصناعية", governorate: "أسيوط", manager_id: null },
  "15003": { id: 15003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة أبنوب الثانوية الصناعية", governorate: "أسيوط" },
  "15004": { id: 15004, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة أسيوط التجارية بنات", governorate: "أسيوط" },
  // Sohag
  "16001": { id: 16001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة سوهاج الميكانيكية", governorate: "سوهاج" },
  "16002": { id: 16002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة جرجا الثانوية الصناعية", governorate: "سوهاج" },
  // Qena
  "17001": { id: 17001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة قنا الميكانيكية", governorate: "قنا" },
  "17002": { id: 17002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة قنا الثانوية الصناعية بنات", governorate: "قنا" },
  "17003": { id: 17003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة نجع حمادي الزخرفية", governorate: "قنا" },
  // Luxor
  "18001": { id: 18001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الأقصر الثانوية الصناعية الميكانيكية", governorate: "الأقصر" },
  "18002": { id: 18002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الأقصر الثانوية الفندقية", governorate: "الأقصر" },
  // Aswan
  "19001": { id: 19001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة أسوان الصناعية المتقدمة", governorate: "أسوان" },
  "19002": { id: 19002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة كيما الثانوية الصناعية", governorate: "أسوان" },
  "19003": { id: 19003, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة أسوان الفندقية المتقدمة", governorate: "أسوان" },

  // --- FRONTIER GOVERNORATES ---
  "20001": { id: 20001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الضبعة النووية لتكنولوجيا الطاقة", governorate: "مطروح" },
  "20002": { id: 20002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة مطروح الثانوية الصناعية بنين", governorate: "مطروح" },
  "21001": { id: 21001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الغردقة الفندقية", governorate: "البحر الأحمر" },
  "21002": { id: 21002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة البترول برأس غارب", governorate: "البحر الأحمر" },
  "22001": { id: 22001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة موط الثانوية الصناعية", governorate: "الوادي الجديد" },
  "22002": { id: 22002, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الخارجة الثانوية الفنية", governorate: "الوادي الجديد" },
  "23001": { id: 23001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة العريش الثانوية المعمارية", governorate: "شمال سيناء" },
  "24001": { id: 24001, unit_type: WorkUnitType.SCHOOL, name_ar: "مدرسة الطور الثانوية الصناعية", governorate: "جنوب سيناء" },
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
          { id: '2', courseName: 'التحول الرقمي في التعليم', provider: 'وزارة الاتصالات', date: '2024-01-10', status: 'Completed' },
          { id: '3', courseName: 'دمج التكنولوجيا في الفصول', provider: 'Microsoft Egypt', date: '2024-06-01', status: 'Ongoing' }
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
      email: "peterfathi2010@gmail.com",
      academic_email: "admin.sys@academy.edu.eg",
      password_hash: "45a4436544600277341e30a57e233d9641753900d720c24c784407519114704c",
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
