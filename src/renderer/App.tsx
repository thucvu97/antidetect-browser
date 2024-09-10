import { ProfileCreationOptions } from 'cloak-stealth';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';

import './App.css';
import '../styles/global.css';

function Hello() {
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
  return (
    <div>
      <div className="space-y-4">
        <div className="w-96 bg-white shadow rounded px-2">w-96</div>
        <div className="w-80 bg-white shadow rounded">w-80</div>
        <div className="w-72 bg-white shadow rounded">w-72</div>
        <div className="w-64 bg-white shadow rounded">w-64</div>
        <div className="w-60 bg-white shadow rounded">w-60</div>
        <div className="w-56 bg-white shadow rounded">w-56</div>
        <div className="w-52 bg-white shadow rounded">w-52</div>
        <div className="w-48 bg-white shadow rounded">w-48</div>
      </div>
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
