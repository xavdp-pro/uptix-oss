import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Activity, Server, Globe, Signal, Cpu, hardDrive, Zap, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Site {
    url: string;
    status: string;
}

interface ServerData {
    serverId: number;
    serverName: string;
    cpu_usage: number;
    ram_usage: number;
    disk_usage: number;
    is_maintenance: boolean;
    sites: Site[];
    timestamp: string;
}

const socket = io();

export default function App() {
    const [servers, setServers] = useState<Record<string, ServerData>>({});
    const [activeTab, setActiveTab] = useState<'servers' | 'sites'>('servers');

    useEffect(() => {
        socket.on('metrics_update', (data: ServerData) => {
            setServers(prev => ({ ...prev, [data.serverName]: data }));
        });
        return () => { socket.off('metrics_update'); };
    }, []);

    const toggleMaintenance = async (serverId: number, currentStatus: boolean) => {
        try {
            await fetch(`/api/servers/${serverId}/maintenance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_maintenance: !currentStatus })
            });
        } catch (err) {
            console.error('Failed to toggle maintenance:', err);
        }
    };

    const serverList = Object.values(servers);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex overflow-hidden">
            <aside className="w-64 border-r border-white/5 bg-black/50 backdrop-blur-xl p-6 flex flex-col gap-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Activity size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Uptix</span>
                </div>
                <nav className="flex flex-col gap-2">
                    <button onClick={() => setActiveTab('servers')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'servers' ? 'bg-blue-600/10 text-blue-500' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Server size={20} /><span className="font-medium">Infrastructure</span>
                    </button>
                    <button onClick={() => setActiveTab('sites')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sites' ? 'bg-blue-600/10 text-blue-500' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Globe size={20} /><span className="font-medium">Websites</span>
                    </button>
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto p-12">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">{activeTab === 'servers' ? 'Systems Monitoring' : 'Service Uptime'}</h1>
                        <p className="text-zinc-500 font-medium">Real-time status of your global infrastructure.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-sm font-semibold uppercase tracking-wider text-green-500">Live Hub Connected</span>
                    </div>
                </header>
                <AnimatePresence mode="wait">
                    {activeTab === 'servers' ? (
                        <motion.div key="servers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {serverList.length === 0 && <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-zinc-600 italic">Waiting for agents to connect...</div>}
                            {serverList.map((srv) => (
                                <div key={srv.serverName} className={`bg-zinc-900/50 border ${srv.is_maintenance ? 'border-amber-500/20 shadow-lg shadow-amber-500/5' : 'border-white/5'} rounded-3xl p-8 backdrop-blur-sm group hover:border-blue-500/30 transition-all relative overflow-hidden`}>
                                    {srv.is_maintenance && <div className="absolute top-0 right-0 bg-amber-500 text-black px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">Maintenance Mode</div>}
                                    <div className="flex justify-between items-start mb-8">
                                        <div><h3 className="text-2xl font-bold mb-1">{srv.serverName}</h3><div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">{srv.is_maintenance ? <div className="flex items-center gap-2 text-amber-500"><ShieldAlert size={14} /><span>Alerts Paused</span></div> : <div className="flex items-center gap-2 text-green-500"><Signal size={14} /><span>Active Monitoring</span></div>}</div></div>
                                        <button onClick={() => toggleMaintenance(srv.serverId, srv.is_maintenance)} className={`p-3 rounded-2xl transition-all ${srv.is_maintenance ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'}`}>{srv.is_maintenance ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}</button>
                                    </div>
                                    <div className="space-y-6 mb-8 opacity-80"><MetricBar label="CPU" value={srv.cpu_usage} icon={<Cpu size={16} />} color={srv.is_maintenance ? 'bg-amber-500' : 'bg-blue-500'} /><MetricBar label="RAM" value={srv.ram_usage} icon={<Activity size={16} />} color={srv.is_maintenance ? 'bg-amber-400' : 'bg-indigo-500'} /></div>
                                    <div className="pt-6 border-t border-white/5"><div className="flex justify-between items-center mb-4"><span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Attached Sites</span><span className="bg-white/5 px-3 py-1 rounded-lg text-xs font-mono border border-white/5">{srv.sites.length} total</span></div>
                                        <div className="grid grid-cols-1 gap-2">{srv.sites.map(site => (<div key={site.url} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${srv.is_maintenance ? 'bg-amber-500/5 border-amber-500/10 opacity-60' : 'bg-black/40 border-white/5'}`}><span className="text-sm font-semibold truncate max-w-[150px]">{site.url.replace('https://', '').replace('http://', '')}</span><span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${site.status === 'UP' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{site.status}</span></div>))}</div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key="sites" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
                            <table className="w-full text-left">
                                <thead><tr className="border-b border-white/5 bg-white/[0.02]"><th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-widest">Website</th><th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-widest">Host Cluster</th><th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-widest">Status</th><th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-widest">Last Check</th></tr></thead>
                                <tbody className="divide-y divide-white/5">{serverList.length === 0 && (<tr><td colSpan={4} className="px-8 py-20 text-center text-zinc-600 italic">No site data available.</td></tr>)}
                                    {serverList.flatMap(srv => srv.sites.map(site => (<tr key={srv.serverName + site.url} className={`transition-colors ${srv.is_maintenance ? 'bg-amber-500/[0.02] hover:bg-amber-500/[0.05]' : 'hover:bg-white/[0.02]'}`}><td className="px-8 py-6 font-bold text-lg"><div className="flex items-center gap-3">{site.url}{srv.is_maintenance && <ShieldAlert size={16} className="text-amber-500" title="Maintenance Mode" />}</div></td><td className="px-8 py-6"><div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg w-fit border border-white/5"><Server size={14} className="text-zinc-500" /><span className="text-zinc-300 font-medium">{srv.serverName}</span></div></td><td className="px-8 py-6"><span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-wide ${site.status === 'UP' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}><div className={`w-2 h-2 rounded-full ${site.status === 'UP' ? 'bg-green-500' : 'bg-red-500'}`} />{site.status}</span></td><td className="px-8 py-6 font-mono text-xs text-zinc-500 font-bold">{new Date(srv.timestamp).toLocaleTimeString()}</td></tr>)))}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function MetricBar({ label, value, icon, color }: { label: string, value: number, icon: any, color: string }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-tighter">{icon}<span>{label}</span></div><span className="font-mono text-sm font-black">{value.toFixed(1)}%</span></div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5"><motion.div className={`h-full rounded-full shadow-lg ${color}`} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, ease: "circOut" }} /></div>
        </div>
    )
}
