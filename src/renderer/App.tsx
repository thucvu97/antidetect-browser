import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';

import { columns } from '@/components/columns';
import { DataTable } from '@/components/data-table';
import { UserNav } from '@/components/user-nav';
import { dataDummy } from '@/data/tasks';
import { useEffect, useState } from 'react';
import '@/styles/global.css';
import useCloakAPI from '@/hooks/useCloakAPI';

// Simulate a database read for tasks.

function Hello() {
  const [tasks] = useState<any>(dataDummy);
  const { getAllProfiles, start, createProfile, loading } = useCloakAPI();
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const fetchedIds = await getAllProfiles();
        console.log('fetchedIds', fetchedIds);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
    };

    fetchProfiles();
  }, []);
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Cloak Stealth Demo: React & Electron App{' '}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <UserNav />
        </div>
      </div>
      <DataTable data={tasks} columns={columns} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
