export type DayBoxProps = {
  isDisabled?:boolean
  dayData: WorkEntry
  date: string;
  projectKey: string;
  userId: string;
  colIndex: number;
  hoveredColIndex: number | null;
  hoveredProjectKey: string | null;
  setHoveredColIndex: (index: number | null) => void;
  setHoveredProjectKey: (key: string | null) => void;
};
export type DayWorkEntry = {
  hours: number;
  note?: string;
};

export type ProjectWorkData = {
  [projectKey: string]: DayWorkEntry;
};

export type UserWorkData = {
  [userId: string]: ProjectWorkData;
};

export type WorkHoursMap = {
  [date: string]: UserWorkData;
};

export type WorkEntry = {
  hours: number;
  note?: string | null;
};

export type WorkHours = {
  [date: string]: {
    [userId: string]: {
      [projectKey: string]: WorkEntry;
    };
  };
};


export interface UseSaveWorkHoursParams {
  date: string;
  userId: string;
  projectKey: string;
  month: number;
  year: number;
  reloadWorkHours: (userId: string, month: number, year: number) => void;
  setWorkHoursForProject: (
    date: string,
    userId: string,
    projectKey: string,
    hours: number,
    note: string
  ) => Promise<void>;
}

export type SaveWorkHoursHandler = (hours: number, note: string) => Promise<void>;
