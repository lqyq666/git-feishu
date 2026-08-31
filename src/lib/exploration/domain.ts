export const DAY_ONE_SIGNAL_COUNT = 3;

export type ExplorationState =
  | "UNKNOWN"
  | "EXPLORING_DESIRE"
  | "DAY_2_READY"
  | "DAY_2_ACTIVE";

export type DesireSignal = {
  admiredPerson: string;
  admiredQuality: string;
  acceptedCost: string;
};

export type DayOneValidation =
  | { complete: true; signals: DesireSignal[] }
  | { complete: false; message: string };

function normalized(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateDayOne(signals: DesireSignal[]): DayOneValidation {
  if (signals.length !== DAY_ONE_SIGNAL_COUNT) {
    return {
      complete: false,
      message: `Day 1 需要恰好 ${DAY_ONE_SIGNAL_COUNT} 条欲望信号。`,
    };
  }

  const cleaned = signals.map((signal) => ({
    admiredPerson: normalized(signal.admiredPerson),
    admiredQuality: normalized(signal.admiredQuality),
    acceptedCost: normalized(signal.acceptedCost),
  }));
  const incompleteIndex = cleaned.findIndex(
    (signal) =>
      !signal.admiredPerson || !signal.admiredQuality || !signal.acceptedCost,
  );

  if (incompleteIndex >= 0) {
    return {
      complete: false,
      message: `请补全第 ${incompleteIndex + 1} 条：现实样本、羡慕之处和愿意承担的代价都不能空着。`,
    };
  }

  return { complete: true, signals: cleaned };
}
