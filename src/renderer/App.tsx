import { ProfileCreationOptions } from 'cloak-stealth';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';

import { columns } from '@/components/columns';
import { DataTable } from '@/components/data-table';
import { UserNav } from '@/components/user-nav';
import { dataDummy } from '@/data/tasks';
import { useEffect, useState } from 'react';
import '@/styles/global.css';

// Simulate a database read for tasks.

function Hello() {
  const [tasks, setTalks] = useState<any>([]);
  const getAllProfiles = async () => {
    try {
      const profileId = await window.electron.getAllProfiles();
      console.log('profileId', profileId);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const start = async (profileId: string) => {
    try {
      console.log('start', profileId);
      await window.electron.start(profileId);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };
  const createProfile = async () => {
    const profileOptions: ProfileCreationOptions = {
      name: 'Test Profile',
      os: 'win',
      canvas: { mode: 'noise', noise: 0.5 },
    };

    try {
      const profileId = await window.electron.create(profileOptions);
      console.log('profileId', profileId);
      start(profileId);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const getData = async () => {
    setTalks(dataDummy);
  };

  useEffect(() => {
    getData();
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
