import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Employee, TrainingCourse } from '../types';
import { analyzeAcademyData } from '../services/geminiService';
import { Bot, Send, User, Loader2, Sparkles, FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AIAssistantProps {
  employees: Employee[];
  courses: TrainingCourse[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ employees, courses }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'مرحباً بك. أنا المساعد الذكي للأكاديمية المهنية للمعلمين. يمكنك سؤالي عن إحصائيات المعلمين، تحليل الاحتياجات التدريبية، أو استفسارات حول الترقيات.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await analyzeAcademyData(employees, courses, userMsg.content);

    const aiMsg: Message = {
      role: 'assistant',
      content: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const generatePDFReport = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });

    // Add Arabic font support (simplified for now, using standard fonts)
    // In a real app, we'd embed an Arabic font like 'Amiri' or 'Cairo'
    doc.setFontSize(22);
    doc.text('TVETA HR System - AI Analysis Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString('ar-EG')}`, 20, 30);
    
    let yPos = 40;

    // Summary Section
    doc.setFontSize(16);
    doc.text('Data Summary', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text(`Total Employees: ${employees.length}`, 25, yPos);
    yPos += 7;
    doc.text(`Total Courses: ${courses.length}`, 25, yPos);
    yPos += 15;

    // Chat History Section
    doc.setFontSize(16);
    doc.text('Analysis History', 20, yPos);
    yPos += 10;

    messages.forEach((msg, idx) => {
      if (idx === 0) return; // Skip welcome message
      
      doc.setFontSize(10);
      const role = msg.role === 'user' ? 'User Query' : 'AI Analysis';
      doc.setTextColor(msg.role === 'user' ? 0 : 100);
      
      const splitText = doc.splitTextToSize(`${role}: ${msg.content}`, 170);
      
      if (yPos + (splitText.length * 5) > 280) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(splitText, 20, yPos);
      yPos += (splitText.length * 5) + 5;
    });

    // Employee Table (Sample)
    if (employees.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Employee Sample Data', 20, 20);
      
      const tableData = employees.slice(0, 15).map(emp => [
        emp.national_id,
        emp.full_name_ar || emp.details?.name || 'N/A',
        emp.job_title || emp.details?.job_title || 'N/A',
        emp.role
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['National ID', 'Name', 'Job Title', 'Role']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });
    }

    doc.save(`TVETA_AI_Report_${new Date().getTime()}.pdf`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
      {/* Chat Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-purple-500/20">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white tracking-tight">المساعد الإداري الذكي</h3>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">مدعوم بواسطة Gemini AI</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generatePDFReport}
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
          >
            <FileText size={14} />
            تصدير تقرير PDF
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-600 shadow-sm">
            <Sparkles size={12} className="text-amber-500" />
            تحليل ذكي للبيانات
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/10">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 border border-slate-100 dark:border-slate-600'
            }`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                  <Markdown>{msg.content}</Markdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              <div className={`text-[10px] mt-2 opacity-50 font-medium ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600 shadow-sm">
              <Bot size={20} />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-3 text-slate-500 dark:text-slate-400 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
              </div>
              <span className="text-xs font-bold">جارِ تحليل البيانات وصياغة الرد...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-5 pl-14 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-right dir-rtl placeholder:text-slate-400 dark:text-white transition-all shadow-inner"
            placeholder="اسأل عن إحصائيات المعلمين، الترقيات، أو اقترح خطط تدريب..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute left-2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} className="transform -rotate-45" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            نظام ذكاء اصطناعي تجريبي • الأكاديمية المهنية للمعلمين
          </p>
        </div>
      </div>
    </div>
  );
};

