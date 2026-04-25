import { Outlet } from 'react-router-dom';
import TabBar from './TabBar';

export default function AppShell() {
  return (
    <>
      <main className="scroll-area">
        <Outlet />
      </main>
      <TabBar />
    </>
  );
}
