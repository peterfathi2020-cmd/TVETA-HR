
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Sector, LabelList } from 'recharts';

const AnyPie = Pie as any;
import { Activity, PieChart as PieIcon } from 'lucide-react';
import { EmployeeType, EmployeeTypeLabels } from '../types';
import { useTheme } from '../context/ThemeContext';

const CHART_COLORS = [
    '#6366F1', // Indigo
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#3B82F6', // Blue
    '#14B8A6', // Teal
];

const RADIAN = Math.PI / 180;

const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xl font-extrabold" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        fill={fill}
        fillOpacity={0.3}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} className="text-sm font-bold fill-slate-800 dark:fill-white">{`العدد: ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} className="text-xs font-medium fill-slate-500 dark:fill-slate-400">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-slate-800/95 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 backdrop-blur-md text-right dir-rtl min-w-[150px]">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">{label || payload[0].name}</p>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: payload[0].fill || payload[0].color}}></div>
                        <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">العدد</span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-bold text-lg font-mono">
                        {payload[0].value}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

interface DashboardChartsProps {
    stats: any;
    onStatClick: (params: string) => void;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ stats, onStatClick }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const { theme } = useTheme();

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const formattedTypeDistribution = useMemo(() => {
        if (!stats?.typeDistribution) return [];
        return stats.typeDistribution.map((item: any) => ({
            ...item,
            name: EmployeeTypeLabels[item.name as EmployeeType] || item.name
        }));
    }, [stats]);

    // Axis tick colors based on theme
    const axisColor = theme === 'dark' ? '#94a3b8' : '#64748B'; // slate-400 vs slate-500

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Age Distribution Chart */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                            <Activity size={24} className="text-indigo-500"/>
                            التوزيع العمري
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">توزيع الموظفين حسب الفئات العمرية</p>
                    </div>
                </div>
                <div className="h-80 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.ageGroups} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.9}/>
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.4}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: axisColor, fontSize: 12, fontWeight: 700}} 
                                dy={10} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: axisColor, fontSize: 12}} 
                            />
                            <RechartsTooltip 
                                cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                                content={<CustomTooltip />}
                            />
                            <Bar 
                                dataKey="count" 
                                fill="url(#colorAge)" 
                                radius={[8, 8, 0, 0]} 
                                barSize={40} 
                                animationDuration={1500}
                                cursor="pointer"
                                onClick={(data) => {
                                    const range = data.name.split('-');
                                    if (range.length === 2) {
                                        onStatClick(`ageMin=${range[0]}&ageMax=${range[1]}`);
                                    } else if (data.name.includes('+')) {
                                        onStatClick(`ageMin=${data.name.replace('+','')}`);
                                    }
                                }}
                            >
                                <LabelList dataKey="count" position="top" className="fill-slate-600 dark:fill-slate-300 font-bold text-xs" offset={10} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Employee Type Pie Chart */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                            <PieIcon size={24} className="text-emerald-500"/>
                            الفئات الوظيفية
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">نسبة توزيع الأدوار الوظيفية</p>
                    </div>
                </div>
                <div className="h-80 w-full flex items-center justify-center relative" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <AnyPie
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                data={formattedTypeDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                dataKey="value"
                                stroke="none"
                                onMouseEnter={onPieEnter}
                                onClick={(data) => {
                                    const clickedName = data.name || (data.payload && data.payload.name);
                                    if (clickedName) {
                                        const typeKey = Object.keys(EmployeeTypeLabels).find(key => EmployeeTypeLabels[key as EmployeeType] === clickedName);
                                        if (typeKey) onStatClick(`type=${typeKey}`);
                                    }
                                }}
                                className="cursor-pointer"
                            >
                                {formattedTypeDistribution.map((entry: any, index: number) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        strokeWidth={0}
                                    />
                                ))}
                            </AnyPie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
