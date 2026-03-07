'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { ChatPanel, ChatFloatingButton } from '@/components/chat';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(true)}/>

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}/>

                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {children}
                </main>
            </div>

            {/* AI Chat */}
            <ChatPanel />
            <ChatFloatingButton />
        </div>
    );
}