import DashboardClient from '@/components/dashboard-client';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1">
        <DashboardClient />
      </main>
    </div>
  );
}
