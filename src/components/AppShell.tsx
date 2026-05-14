import { Outlet } from 'react-router-dom';
import TabBar from './TabBar';

export default function AppShell() {
  return (
    <div className="flex flex-col h-full">
      <main className="scroll-area">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
