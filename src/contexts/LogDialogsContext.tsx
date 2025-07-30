
'use client';

import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import type { GlucoseReading, InsulinLog, ActivityLog, MedicationLog } from '@/types';

type LogType = 'glucose' | 'insulin' | 'activity' | 'medication' | 'voice';

type InitialData = {
  glucose?: Partial<GlucoseReading>;
  insulin?: Partial<InsulinLog>;
  activity?: Partial<ActivityLog>;
  medication?: Partial<MedicationLog>;
  voice?: undefined; // Voice doesn't need initial data
};

type SuccessListeners = {
  glucose: (() => void)[];
  insulin: (() => void)[];
  activity: (() => void)[];
  medication: (() => void)[];
  voice: (() => void)[];
};

interface LogDialogsContextType {
  openLog: LogType | null;
  initialData: InitialData;
  openDialog: (logType: LogType, data?: Partial<any>) => void;
  closeDialog: () => void;
  setInitialData: (logType: LogType, data?: Partial<any>) => void;
  notifySuccess: (logType: LogType) => void;
  addSuccessListener: (logType: LogType, listener: () => void) => () => void;
}

const LogDialogsContext = createContext<LogDialogsContextType | undefined>(undefined);

export const LogDialogsProvider = ({ children }: { children: ReactNode }) => {
  const [openLog, setOpenLog] = useState<LogType | null>(null);
  const [initialData, setInitialDataState] = useState<InitialData>({});
  const [listeners, setListeners] = useState<SuccessListeners>({
    glucose: [],
    insulin: [],
    activity: [],
    medication: [],
    voice: [],
  });

  const openDialog = useCallback((logType: LogType, data?: Partial<any>) => {
    if (data) {
      setInitialDataState(prev => ({ ...prev, [logType]: data }));
    }
    setOpenLog(logType);
  }, []);

  const closeDialog = useCallback(() => {
    setOpenLog(null);
    setInitialDataState({}); // Clear initial data on close
  }, []);

  const setInitialData = useCallback((logType: LogType, data?: Partial<any>) => {
    setInitialDataState(prev => ({ ...prev, [logType]: data }));
  }, []);

  const notifySuccess = useCallback((logType: LogType) => {
    listeners[logType].forEach(listener => listener());
    closeDialog();
  }, [listeners, closeDialog]);

  const addSuccessListener = useCallback((logType: LogType, listener: () => void) => {
    setListeners(prev => ({
      ...prev,
      [logType]: [...prev[logType], listener],
    }));
    // Return an unsubscribe function
    return () => {
      setListeners(prev => ({
        ...prev,
        [logType]: prev[logType].filter(l => l !== listener),
      }));
    };
  }, []);

  const value = {
    openLog,
    initialData,
    openDialog,
    closeDialog,
    setInitialData,
    notifySuccess,
    addSuccessListener,
  };

  return (
    <LogDialogsContext.Provider value={value}>
      {children}
    </LogDialogsContext.Provider>
  );
};

export const useLogDialog = () => {
  const context = useContext(LogDialogsContext);
  if (context === undefined) {
    throw new Error('useLogDialog must be used within a LogDialogsProvider');
  }
  return context;
};
