import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import useCloakAPI from '@/hooks/useCloakAPI';
import { ColumnDef } from '@tanstack/react-table';
import { BrowserStatusEvent, ProfileData } from 'cloak-stealth';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type BrowserStatus = 'ready' | 'starting' | 'running';

function Hello() {
  const {
    getAllProfiles,
    start,
    createProfile,
    closeBrowser,
    deleteAllProfiles,
    loading,
    profiles,
  } = useCloakAPI();

  const [browserStatuses, setBrowserStatuses] = useState<
    Record<string, BrowserStatus>
  >({});
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

  useEffect(() => {
    fetchAllProfile();

    const unsubscribe = window.electron.ipcRenderer.onBrowserStatusUpdate(
      ({
        status,
        profileId,
      }: {
        status: BrowserStatusEvent;
        profileId: string;
      }) => {
        if (status === 'spawn') {
          setBrowserStatuses((prev) => ({ ...prev, [profileId]: 'running' }));
        } else if (status === 'close') {
          setBrowserStatuses((prev) => ({ ...prev, [profileId]: 'ready' }));
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchAllProfile = async () => {
    await getAllProfiles();
  };

  const handleCreateProfile = async () => {
    try {
      const profileCount = profiles?.length ?? 0;
      const newProfileId = await createProfile({
        name: `Profile ${profileCount + 1}`,
        os: 'mac',
        canvas: { mode: 'noise' },
      });
      console.log('New profile created:', newProfileId);
      fetchAllProfile();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleStartProfile = async (profileId: string) => {
    setBrowserStatuses((prev) => ({ ...prev, [profileId]: 'starting' }));
    try {
      await start(profileId);
      // Status will be updated to 'running' when we receive the 'spawn' event
    } catch (error) {
      console.error('Error starting profile:', error);
      setBrowserStatuses((prev) => ({ ...prev, [profileId]: 'ready' }));
    }
  };

  const handleStopProfile = async (profileId: string) => {
    try {
      await closeBrowser(profileId);
      // Status will be updated to 'ready' when we receive the 'close' event
    } catch (error) {
      console.error('Error stopping profile:', error);
    }
  };

  const handleDeleteSelectedProfiles = async () => {
    try {
      console.log('Deleting profiles:', selectedProfileIds);
      await deleteAllProfiles(selectedProfileIds);
      setSelectedProfileIds([]);
      fetchAllProfile();
    } catch (error) {
      console.error('Error deleting profiles:', error);
    }
  };

  const columns = useMemo<ColumnDef<ProfileData>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedProfileIds.includes(row.original.id)}
            onCheckedChange={(value) => {
              if (value) {
                setSelectedProfileIds((prev) => [...prev, row.original.id]);
              } else {
                setSelectedProfileIds((prev) =>
                  prev.filter((id) => id !== row.original.id),
                );
              }
            }}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'os',
        header: 'OS',
      },
      {
        accessorKey: 'browserType',
        header: 'Browser Type',
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: ({ row }) => {
          const createdAt = row.getValue('createdAt') as any;
          return createdAt ? new Date(createdAt).toLocaleString() : 'N/A';
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const profile = row.original;
          const status = browserStatuses[profile.id] || 'ready';
          switch (status) {
            case 'starting':
              return <p className="text-yellow-500">Starting...</p>;
            case 'running':
              return <p className="text-green-500">Running</p>;
            default:
              return <p>Ready</p>;
          }
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const profile = row.original;
          const status = browserStatuses[profile.id] || 'ready';

          if (status === 'running') {
            return (
              <Button
                onClick={() => handleStopProfile(profile.id)}
                className="border-red-500 text-red-500 hover:bg-red-100 bg-red-100"
                size="sm"
              >
                Stop
              </Button>
            );
          } else if (status === 'starting') {
            return (
              <Button disabled size="sm">
                Starting...
              </Button>
            );
          } else {
            return (
              <Button onClick={() => handleStartProfile(profile.id)} size="sm">
                Start
              </Button>
            );
          }
        },
      },
    ],
    [browserStatuses, selectedProfileIds],
  );

  const onRowSelectionChange = useCallback(
    (updatedSelection: Record<string, boolean>) => {
      const selectedIds = Object.keys(updatedSelection).filter(
        (id) => updatedSelection[id],
      );
      setSelectedProfileIds(selectedIds);
    },
    [],
  );

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Cloak Stealth Demo: React & Electron App
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateProfile} disabled={loading}>
            Create New Profile
          </Button>
          <Button
            onClick={handleDeleteSelectedProfiles}
            disabled={selectedProfileIds.length === 0 || loading}
            variant="destructive"
          >
            Delete Selected Profiles ({selectedProfileIds.length})
          </Button>
        </div>
      </div>
      <div>
        <Button
          onClick={fetchAllProfile}
          variant="default"
          size="sm"
          disabled={loading}
        >
          Refresh
        </Button>
      </div>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        <DataTable
          columns={columns}
          data={profiles ?? []}
          onRowSelectionChange={onRowSelectionChange}
        />
      </div>
    </div>
  );
}

export default Hello;
