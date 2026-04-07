
export interface Bell {
  id: string;
  name: string;
  time: string; // "HH:mm" format
  sound: string; // base64 data URL
  soundName?: string; // name of the uploaded file
}

export interface Schedule {
  [day: string]: Bell[];
}

export interface SchedulesData {
  [categoryName: string]: Schedule;
}