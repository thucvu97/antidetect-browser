import { ProfileCreationOptions } from 'cloak-stealth';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import icon from '../../assets/icon.svg';

import './App.css';

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
      <div className="Hello">
        <img width="200" alt="icon" src={icon} />
        <button type="button" onClick={createProfile}>
          Create Profile
        </button>
        <button type="button" onClick={start}>
          Start Profile
        </button>
      </div>
      <h1>electron-react-boilerplate</h1>
      <div className="Hello">
        <a
          href="https://electron-react-boilerplate.js.org/"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              📚
            </span>
            Read our docs
          </button>
        </a>
        <a
          href="https://github.com/sponsors/electron-react-boilerplate"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="folded hands">
              🙏
            </span>
            Donate
          </button>
        </a>
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
