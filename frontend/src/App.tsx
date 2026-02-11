import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Activity, Server, Globe, Signal, Cpu, hardDrive, Zap } from 'lucide-react';
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

    const serverList = Object.values(servers);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-black/50 backdrop-blur-xl p-6 flex flex-col gap-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Activity size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Uptix</span>
                </div>

                <nav className="flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('servers')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'servers' ? 'bg-blue-600/10 text-blue-500' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Server size={20} />
                        <span className="font-medium">Infrastructure</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('sites')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sites' ? 'bg-blue-600/10 text-blue-500' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Globe size={20} />
                        <span className="font-medium">Websites</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-12">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">
                            {activeTab === 'servers' ? 'Systems Monitoring' : 'Service Uptime'}
                        </h1>
                        <p className="text-zinc-500 font-medium">Real-time status of your global infrastructure.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold uppercase tracking-wider text-green-500">Live Hub Connected</span>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'servers' ? (
                        <motion.div
                            key="servers"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6"
                        >
                            {serverList.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-zinc-600 italic">
                                    Waiting for agents to connect...
                                </div>
                            )}
                            {serverList.map((srv) => (
                                <div key={srv.serverName} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm group hover:border-blue-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h3 className="text-2xl font-bold mb-1">{srv.serverName}</h3>
                                            <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                                <Signal size={14} className="text-green-500" />
                                                <span>Connected</span>
                                            </div>
                                        </div>
                                        <Zap size={24} className="text-zinc-700 group-hover:text-blue-500 transition-colors" />
                                    </div>

                                    <div className="space-y-6 mb-8">
                                        <MetricBar label="CPU" value={srv.cpu_usage} icon={<Cpu size={16} />} color="bg-blue-500" />
                                        <MetricBar label="RAM" value={srv.ram_usage} icon={<Activity size={16} />} color="bg-indigo-500" />
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm font-bold text-zinc-500 uppercase">Attached Sites</span>
                                            <span className="bg-white/5 px-2 py-1 rounded-md text-xs font-mono">{srv.sites.length} total</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {srv.sites.map(site => (
                                                <div key={site.url} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                                    <span className="text-sm font-medium truncate max-w-[150px]">{site.url.replace('https://', '').replace('http://', '')}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${site.status === 'UP' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {site.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sites"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm"
                        >
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-widest">Website</th>
                                        <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-widest">Host Cluster</th>
                                        <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-widest">Response</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {serverList.length === 0 && (
                                        <tr><td colSpan={4} className="px-8 py-20 text-center text-zinc-600 italic">No site data available.</td></tr>
                                    )}
                                    {serverList.flatMap(srv => srv.sites.map(site => (
                                        <tr key={srv.serverName + site.url} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-6 font-medium text-lg">{site.url}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Server size={14} className="text-zinc-600" />
                                                    <span className="text-zinc-400">{srv.serverName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${site.status === 'UP' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${site.status === 'UP' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    {site.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 font-mono text-xs text-zinc-500">
                                                {new Date(srv.timestamp).toLocaleTimeString()}
                                            </td>
                                        </tr>
                                    )))}
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
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-zinc-400 font-medium text-sm">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="font-mono text-sm font-bold">{value.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </div>
        </div>
    )
}
