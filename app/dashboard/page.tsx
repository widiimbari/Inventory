"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { 
  Package, 
  Warehouse, 
  Boxes, 
  Activity, 
  Clock, 
  CalendarDays,
  History,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

interface DashboardData {
  summary: {
    boxCount: number;
    palletCount: number;
    dailyOutput: number;
    weeklyOutput: number;
  };
  topTypes: { type: string; count: number }[];
  recentLogs: { id: number; desc: string; timestamp: string; line: string; code: string }[];
  chartData: { date: string; count: number }[];
  activeLines: { line: string; meter_type: string; no_po: string; daily_counter: string; qty_box: string }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to fetch");
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-50/50 border border-slate-100">
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : value?.toLocaleString("id-ID")}
            </h4>
          </div>
        </div>
        {subtext && (
           <div className="mt-4 flex items-center justify-end text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {subtext}
           </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-[#F8FAFC] min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Analytics Dashboard</h2>
          <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest">Real-time production monitoring & inventory status</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border shadow-sm text-sm font-bold text-slate-600 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Today's Output" 
            value={data?.summary.dailyOutput} 
            icon={Activity} 
            color="text-emerald-600"
            subtext="Products produced today"
        />
        <StatCard 
            title="Weekly Output" 
            value={data?.summary.weeklyOutput} 
            icon={TrendingUp} 
            color="text-blue-600"
            subtext="Products this week (Mon-Sun)"
        />
        <StatCard 
            title="Total Boxes" 
            value={data?.summary.boxCount} 
            icon={Warehouse} 
            color="text-indigo-600"
            subtext="Registered in system"
        />
        <StatCard 
            title="Total Pallets" 
            value={data?.summary.palletCount} 
            icon={Boxes} 
            color="text-violet-600"
            subtext="Ready for shipment"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid gap-6 md:grid-cols-7">
        
        {/* Left: Productivity Chart (Span 4) */}
        <Card className="md:col-span-4 border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden">
          <CardHeader className="bg-white pb-2">
            <CardTitle className="text-lg font-bold text-slate-800">Weekly Productivity</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-400 uppercase tracking-widest">Daily production output for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="bg-white pl-0 pb-6">
            <div className="h-[300px] w-full">
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">Loading Chart...</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis 
                                dataKey="date" 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                                dy={10}
                            />
                            <YAxis 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                            />
                            <Tooltip 
                                cursor={{ fill: '#F8FAFC' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                            />
                            <Bar dataKey="count" fill="#0F172A" radius={[6, 6, 0, 0]} barSize={32}>
                                {data?.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === data.chartData.length - 1 ? '#3B82F6' : '#1E293B'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Top Products (Span 3) */}
        <Card className="md:col-span-3 border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Top Meter Types</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-400 uppercase tracking-widest">Highest volume production distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />)}
                    </div>
                ) : (
                    data?.topTypes.map((item, index) => (
                        <div key={item.type} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-slate-700 truncate pr-4">{item.type}</span>
                                <span className="font-black text-slate-900">{item.count.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        index === 0 ? "bg-blue-500" : "bg-slate-300"
                                    )}
                                    style={{ width: `${Math.min(100, (item.count / (data.topTypes[0]?.count || 1)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
                {!loading && data?.topTypes.length === 0 && (
                    <div className="text-center text-slate-400 text-sm py-4 italic font-medium">No production data available</div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Recent Logs */}
      <Card className="border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold text-slate-800">System Activity</CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-400 uppercase tracking-widest">Real-time system events and audit logs</CardDescription>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                    <History className="h-5 w-5 text-slate-400" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
                {loading ? (
                     <div className="text-center py-12 text-slate-400 font-medium italic">Syncing activity logs...</div>
                ) : (
                    data?.recentLogs.map((log, index) => (
                        <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                                log.code === 'NG' || log.code === 'ERR' ? "bg-red-50 border-red-100 text-red-500" : "bg-blue-50 border-blue-100 text-blue-500"
                            )}>
                                {log.code === 'NG' || log.code === 'ERR' ? <AlertCircle className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{log.desc}</p>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(log.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-black">
                                        {log.line}
                                    </span>
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <span className={cn(
                                    "text-[10px] font-black px-2 py-1 rounded-md border uppercase tracking-widest",
                                    log.code === 'OK' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                )}>
                                    {log.code}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                {!loading && data?.recentLogs.length === 0 && (
                    <div className="text-center py-12 text-slate-400 font-medium italic">No recent activity found.</div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
