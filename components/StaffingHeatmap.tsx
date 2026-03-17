
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Employee, WorkUnit } from '../types';
import { EGYPT_GOVERNORATES } from '../constants';
import { Users, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';

interface StaffingHeatmapProps {
  employees: Employee[];
  units: WorkUnit[];
}

export const StaffingHeatmap: React.FC<StaffingHeatmapProps> = ({ employees, units }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [stats, setStats] = useState<Record<string, { total: number, capacity: number, ratio: number }>>({});

  useEffect(() => {
    // Calculate stats per governorate
    const govStats: Record<string, { total: number, capacity: number, ratio: number }> = {};
    
    EGYPT_GOVERNORATES.forEach(gov => {
      const govEmployees = employees.filter(emp => {
          const unit = units.find(u => u.id === emp.work_place_id);
          return unit?.governorate === gov;
      });
      
      // Mock capacity for demo (e.g., 100 per gov)
      const capacity = 100; 
      const total = govEmployees.length;
      govStats[gov] = {
        total,
        capacity,
        ratio: total / capacity
      };
    });
    
    setStats(govStats);

    if (!svgRef.current) return;

    const width = 600;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const sortedGovs = Object.entries(govStats)
      .sort((a, b) => b[1].ratio - a[1].ratio)
      .slice(0, 10); // Top 10 for clarity

    const x = d3.scaleLinear()
      .domain([0, d3.max(sortedGovs, d => d[1].ratio) || 1])
      .range([0, innerWidth]);

    const y = d3.scaleBand()
      .domain(sortedGovs.map(d => d[0]))
      .range([0, innerHeight])
      .padding(0.2);

    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([1.5, 0.5]); // Red for overstaffed (>1.5), Green for understaffed (<0.5)

    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("class", "text-xs fill-brand-300 font-bold");

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${(Number(d) * 100).toFixed(0)}%`))
      .selectAll("text")
      .attr("class", "text-xs fill-brand-400");

    g.selectAll("rect")
      .data(sortedGovs)
      .enter()
      .append("rect")
      .attr("y", d => y(d[0])!)
      .attr("width", 0)
      .attr("height", y.bandwidth())
      .attr("fill", d => colorScale(d[1].ratio))
      .attr("rx", 4)
      .transition()
      .duration(1000)
      .attr("width", d => x(d[1].ratio));

    g.selectAll(".label")
      .data(sortedGovs)
      .enter()
      .append("text")
      .attr("class", "text-[10px] fill-white font-bold")
      .attr("x", d => x(d[1].ratio) + 5)
      .attr("y", d => y(d[0])! + y.bandwidth() / 2 + 4)
      .text(d => `${d[1].total} موظف`);

  }, [employees, units]);

  return (
    <div className="bg-brand-800/50 rounded-xl border border-brand-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="text-brand-400" size={20} />
            خريطة العجز والزيادة التفاعلية
          </h3>
          <p className="text-xs text-brand-400 mt-1">توزيع القوى العاملة مقارنة بالاحتياج الفعلي</p>
        </div>
        <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-[10px] text-brand-300">زيادة</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-brand-300">عجز</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 overflow-x-auto">
          <svg ref={svgRef} width="600" height="400" viewBox="0 0 600 400" className="max-w-full h-auto" />
        </div>
        
        <div className="space-y-4">
            <h4 className="text-sm font-bold text-brand-200 border-b border-brand-700 pb-2">أبرز المؤشرات</h4>
            
            <div className="p-4 bg-red-900/20 border border-red-900/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertCircle size={16} />
                    <span className="text-xs font-bold">أعلى نسبة زيادة</span>
                </div>
                <p className="text-lg font-bold text-white">القاهرة</p>
                <p className="text-[10px] text-red-300/70 mt-1">نسبة إشغال: 145% (+45 موظف)</p>
            </div>

            <div className="p-4 bg-emerald-900/20 border border-emerald-900/30 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <TrendingDown size={16} />
                    <span className="text-xs font-bold">أعلى نسبة عجز</span>
                </div>
                <p className="text-lg font-bold text-white">مطروح</p>
                <p className="text-[10px] text-emerald-300/70 mt-1">نسبة إشغال: 42% (-58 موظف)</p>
            </div>

            <div className="p-4 bg-brand-900/40 border border-brand-700 rounded-lg">
                <div className="flex items-center gap-2 text-brand-400 mb-2">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold">المحافظات الأكثر استقراراً</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {['بورسعيد', 'السويس', 'الغربية'].map(g => (
                        <span key={g} className="px-2 py-1 bg-brand-800 rounded text-[10px] text-brand-200 border border-brand-700">{g}</span>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
