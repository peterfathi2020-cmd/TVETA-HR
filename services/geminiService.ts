
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, TrainingCourse, TrainingStatus, Employee } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System instruction setup
const systemInstruction = `
أنت مساعد ذكي إداري للأكاديمية المهنية للمعلمين في مصر.
دورك هو تحليل البيانات المقدمة (المعلمين والدورات التدريبية) وتقديم رؤى باللغة العربية.
يجب أن تكون إجاباتك مهنية، دقيقة، وموجهة للإداريين وصناع القرار.
`;

export const analyzeAcademyData = async (
  employees: Employee[], 
  courses: TrainingCourse[], 
  query: string
): Promise<string> => {
  try {
    const dataContext = JSON.stringify({
      totalEmployees: employees.length,
      sampleEmployees: employees.slice(0, 20), // Send a subset to save context if large
      activeCourses: courses.filter(c => c.status !== TrainingStatus.Completed),
      coursesSummary: courses.map(c => ({ title: c.title, enrolled: c.enrolled, capacity: c.capacity }))
    });

    const prompt = `
    بناءً على البيانات التالية للأكاديمية:
    ${dataContext}

    يرجى الإجابة على استفسار المستخدم التالي:
    "${query}"

    قم بصياغة الإجابة بتنسيق Markdown منظم.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Lower temperature for more factual administrative responses
      },
    });

    return response.text || "عذراً، لم أتمكن من توليد تحليل في الوقت الحالي.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. يرجى التحقق من مفتاح API.";
  }
};

export const suggestTrainingPath = async (teacher: Teacher): Promise<string> => {
  try {
    const prompt = `
    اقترح مساراً تدريبياً للمعلم التالي بهدف الترقية والتطوير المهني:
    الاسم: ${teacher.fullName}
    المستوى الحالي: ${teacher.level}
    المادة: ${teacher.subject}
    ساعات التدريب الحالية: ${teacher.trainingHours}
    
    الرد يجب أن يكون قائمة قصيرة من 3 دورات مقترحة مع سبب الاقتراح لكل دورة.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "أنت خبير في التطوير المهني للمعلمين.",
      }
    });

    return response.text || "لا توجد مقترحات حالياً.";
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return "تعذر الحصول على الاقتراحات.";
  }
};

export const analyzeEmployeeProfileComprehensive = async (employee: Employee): Promise<any> => {
  try {
    const profileContext = `
    - الاسم: ${employee.full_name_ar}
    - المسمى الوظيفي الحالي: ${employee.job_title}
    - تاريخ التعيين: ${employee.employment_date}
    - المؤهلات العلمية: ${employee.qualifications?.map(q => `${q.degree} من ${q.institution} (سنة ${q.year})`).join('، ') || 'غير مسجل'}
    - سجل التدريب السابق: ${employee.training_history?.map(t => `${t.courseName} (بتاريخ ${t.date})`).join('، ') || 'لا يوجد سجل تدريبي'}
    - التخصص (للمعلمين): ${employee.teacher_details?.specialization || 'غير محدد'}
    - المرحلة التعليمية (للمعلمين): ${employee.teacher_details?.educational_stage || 'غير محدد'}
    - الدور الوظيفي: ${employee.role || 'موظف'}
    `;

    const prompt = `
    أنت خبير استراتيجي في تطوير الموارد البشرية بالأكاديمية المهنية للمعلمين.
    بناءً على بيانات الموظف التالية، قم بتقديم تحليل شامل ومفصل:

    **بيانات الموظف:**
    ${profileContext}

    **المطلوب منك هو الآتي:**

    1.  **تحليل نقاط القوة (Strengths):**
        - استنبط 3-4 نقاط قوة أساسية بناءً على مؤهلاته وخبرته وتاريخه الوظيفي.
        - يجب أن تكون النقاط محددة وواقعية (مثال: "خبرة أكاديمية متخصصة في [التخصص]" أو "التزام واضح بالتطوير المهني المستمر بظهور دورات حديثة في سجله").

    2.  **تحديد الفجوات المهارية (Skill Gaps):**
        - حدد 2-3 فجوات مهارية أو معرفية قد تعيق تطوره المهني أو ترقيته للدرجة الأعلى.
        - يجب أن تكون الفجوات قابلة للتطوير (مثال: "نقص في المهارات التكنولوجية الحديثة في التعليم" أو "الحاجة لتطوير مهارات القيادة التربوية للمناصب الإشرافية").

    3.  **اقتراح مسار تدريبي مخصص (Recommended Training Path):**
        - اقترح 3 دورات تدريبية **محددة بالاسم** تكون خطة عمل واضحة للموظف.
        - لكل دورة، اذكر **السبب (Reason)** بوضوح لربطها بإحدى الفجوات المهارية التي حددتها.
        - يجب أن تكون الدورات متنوعة بين المهارات التقنية، التربوية، والإدارية حسب الحاجة.

    **صيغة المخرجات:**
    الرجاء إخراج التحليل بالكامل ككائن JSON (JSON object) باللغة العربية، مع الالتزام بالبنية التالية بدقة:
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Changed from gemini-3.1-pro-preview to fix 404 error
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "قائمة بنقاط القوة الرئيسية للموظف."
            },
            skillGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "قائمة بالفجوات المهارية التي تحتاج إلى تطوير."
            },
            recommendedCourses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "اسم الدورة التدريبية المقترحة." },
                  reason: { type: Type.STRING, description: "سبب اقتراح هذه الدورة وعلاقتها بالفجوات المهارية." }
                },
                required: ["title", "reason"]
              },
              description: "قائمة بالدورات التدريبية الموصى بها كخطة تطوير."
            }
          },
          required: ["strengths", "skillGaps", "recommendedCourses"]
        }
      }
    });

    const rawText = response.text;
    if (rawText) {
        // Clean the response from potential markdown backticks
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText);
    }
    return null;

  } catch (error) {
    console.error("Gemini Comprehensive Analysis Error:", error);
    // Provide a structured error object
    return {
      error: true,
      message: "حدث خطأ أثناء توليد التحليل. قد يكون هناك ضغط على الخدمة أو مشكلة في الاتصال."
    };
  }
};
